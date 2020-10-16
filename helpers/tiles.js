const zlib = require("zlib");
const util = require("util");
const Boom = require("@hapi/boom");
const mbtiles = util.promisify(require("@mapbox/mbtiles"));
const sqlite3 = require("sqlite3");
const vtpbf = require("vt-pbf");
const geojsonvt = require("geojson-vt");
const clone = require("clone");
const turf = require("@turf/turf");
const shaver = require("@mapbox/vtshaver");
const shave = util.promisify(shaver.shave);
const decorator = require("@mapbox/tile-decorator");
const nameMapping = require("../resources/config/nameMapping.json");

async function getTileset(path) {
  try {
    const tileset = await new mbtiles(`${path}?mode=ro`);

    // sqlite uses file locking which can often cause problems when accessing files via NFS:
    //    "Do not use SQLite with NFS."
    // Source: https://stackoverflow.com/a/9962003/1805388
    //
    // The following is a workaround to open the sqlite DB such that file locking is disabled.
    // Note: This works only because we are never writing to the DB.
    //
    // Inside @mapbox/mbtiles, the sqlite DB is opened here: https://github.com/mapbox/node-mbtiles/blob/v0.11.0/lib/mbtiles.js#L69
    // We re-open it below with file locking disabled, which makes it work over NFS with broken file locking.
    //
    // Relevant info from section "URI Filenames" in the documentation for sqlite3_open_v2():
    // - If URI filename interpretation is enabled, and the filename argument begins with "file:", then the filename is interpreted as a URI.
    // - URI filename interpretation is enabled if the SQLITE_OPEN_URI flag is set in the third argument to sqlite3_open_v2().
    // - nolock: The nolock parameter is a boolean query parameter which if set disables file locking in rollback journal modes.
    // Source: https://sqlite.org/c3ref/open.html
    tileset._db = new sqlite3.Database(
      `file:${path}?nolock=1`,
      sqlite3.OPEN_READONLY | sqlite3.OPEN_URI
    );

    return tileset;
  } catch (error) {
    return error;
  }
}

const labelLayerList = [
  "aerodrom_label",
  "mountain_peak",
  "place",
  "poi",
  "transportation_name",
  "water_name",
  "waterway",
];
const nameWhitelist = ["name", "name:de"];

function getValueIndices(layer, key) {
  var keyIndex = layer.keys.indexOf(key);
  var valueIndices = new Set();

  for (var i = 0; i < layer.features.length; i++) {
    var tags = layer.features[i].tags;
    for (var j = 0; j < tags.length; j += 2) {
      if (tags[j] === keyIndex) {
        var value = layer.values[tags[j + 1]];
        if (value !== undefined) valueIndices.add(tags[j + 1]);
        else throw new Error(key + " not found");
        break;
      }
    }
  }
  return valueIndices;
}

function getValue(layer, key, valueIndex) {
  const currentValue = layer.values[valueIndex];
  if (key === "name" && nameMapping[currentValue]) {
    return nameMapping[currentValue];
  } else if (key === "name:de" && nameMapping[currentValue]) {
    return nameMapping[currentValue];
  } else {
    return layer.values[valueIndex];
  }
}

function getChangedValues(layer) {
  layer.keys.forEach((key) => {
    const valueIndices = getValueIndices(layer, key);
    for (let valueIndex of valueIndices.values()) {
      layer.values[valueIndex] = getValue(layer, key, valueIndex);
    }
  });
  return layer.values;
}

function getFilteredTile(tile) {
  tile.layers
    .filter((layer) => {
      return labelLayerList.includes(layer.name);
    })
    .forEach((layer) => {
      const keysToKeep = layer.keys.filter((key) => {
        return (
          !key.startsWith("name") ||
          (key.startsWith("name") && nameWhitelist.includes(key))
        );
      });
      decorator.selectLayerKeys(layer, keysToKeep);
      delete layer.keyLookup;
      delete layer.valLookup;
      layer.values = getChangedValues(layer);
    });
  return tile;
}

async function getTile(hash, tileset, z, x, y, styleName, optimize) {
  try {
    let tile = await this.tilesets[tileset].tileset.getTile(z, x, y);
    tile = decorator.write(
      getFilteredTile(decorator.read(zlib.gunzipSync(tile)))
    );
    if (styleName && optimize) {
      const filters = new shaver.Filters(
        shaver.styleToFilters(this.styles[styleName].style)
      );
      const options = {
        filters: filters,
        zoom: z,
        compress: {
          type: "gzip",
        },
      };
      return await shave(tile, options);
    } else {
      return tile;
    }
  } catch (error) {
    return Boom.notFound();
  }
}

// Returns the number `num` modulo `range` in such a way so it lies within
// `range[0]` and `range[1]`. The returned value will be always smaller than `range[1]`
function wrapNum(x, range, includeMax) {
  let max = range[1],
    min = range[0],
    d = max - min;
  return x === max && includeMax ? x : ((((x - min) % d) + d) % d) + min;
}

function normalizeCoordinates(geojsonList, range) {
  return clone(geojsonList).map(function (geojson) {
    turf.coordEach(geojson, (currentCoord) => {
      currentCoord[0] = wrapNum(currentCoord[0], range, true);
    });
    return geojson;
  });
}

const antimeridianArea = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [70, -90],
        [335, -90],
        [335, 90],
        [70, 90],
        [70, -90],
      ],
    ],
  },
  bbox: [
    [70, -90],
    [335, 90],
  ],
};

const regularArea = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [70, -90],
        [-25, -90],
        [-25, 90],
        [70, 90],
        [70, -90],
      ],
    ],
  },
  bbox: [
    [70, -90],
    [-25, 90],
  ],
};

function insideArea(geojsonList, area) {
  return geojsonList.every((geojson) => {
    try {
      const center = turf.center(geojson);
      return turf.booleanContains(area, center);
    } catch (e) {
      // if the geojson can't be handled by turfjs we ignore this geometry
      return true;
    }
  });
}

// If all features are within the antimeridian area
// return the geojson normalized to 0 and 360 degrees
function transformCoordinates(geojsonList) {
  const regularGeojsonList = normalizeCoordinates(geojsonList, [-180, 180]);
  const antimeridianGeojsonList = normalizeCoordinates(geojsonList, [0, 360]);
  if (insideArea(antimeridianGeojsonList, antimeridianArea)) {
    return antimeridianGeojsonList;
  }
  return regularGeojsonList;
}

function getTransformedGeoJSON(geojsonList) {
  geojsonList = transformCoordinates(geojsonList);
  return geojsonList;
}

async function getTilesetTile(item, qId, z, x, y) {
  try {
    const geojsonList = getTransformedGeoJSON(item.geojsonList);
    const features = await this.helpers.getFeatures(geojsonList);
    const tileObject = {};
    features.points.forEach((feature) => {
      const tileIndex = geojsonvt(feature.geojson);
      const tile = tileIndex.getTile(z, x, y);
      if (tile) {
        tileObject[feature.id] = tile;
      }
    });
    features.linestrings.forEach((feature) => {
      const tileIndex = geojsonvt(feature.geojson);
      const tile = tileIndex.getTile(z, x, y);
      if (tile) {
        tileObject[feature.id] = tile;
      }
    });
    features.polygons.forEach((feature) => {
      const tileIndex = geojsonvt(feature.geojson);
      const tile = tileIndex.getTile(z, x, y);
      if (tile) {
        tileObject[feature.id] = tile;
      }
    });
    return zlib.gzipSync(vtpbf.fromGeojsonVt(tileObject, { version: 2 }));
  } catch (error) {
    return Boom.notFound();
  }
}

module.exports = {
  getTileset: getTileset,
  getTile: getTile,
  getTilesetTile: getTilesetTile,
  transformCoordinates: transformCoordinates,
};
