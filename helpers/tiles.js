const zlib = require("zlib");
const Boom = require("@hapi/boom");
const mbtiles = require("@mapbox/mbtiles");
const vtpbf = require("vt-pbf");
const geojsonvt = require("geojson-vt");
const clone = require("clone");
const turf = require("@turf/turf");

function getTileset(path) {
  const tilesetPath = `${path}?mode=ro`;
  return new Promise(function(resolve, reject) {
    new mbtiles(tilesetPath, function(err, tileset) {
      if (err) {
        reject(err);
      } else {
        resolve(tileset);
      }
    });
  });
}

async function getTile(tileset, z, x, y) {
  return await new Promise((resolve, reject) => {
    this.tilesets[tileset].getTile(z, x, y, (error, tile) => {
      if (error) {
        reject(Boom.notFound());
      } else {
        resolve(tile);
      }
    });
  });
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
  return clone(geojsonList).map(function(geojson) {
    turf.coordEach(geojson, currentCoord => {
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
    coordinates: [[[70, -90], [335, -90], [335, 90], [70, 90], [70, -90]]]
  },
  bbox: [[70, -90], [335, 90]]
};

const regularArea = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [[[70, -90], [-25, -90], [-25, 90], [70, 90], [70, -90]]]
  },
  bbox: [[70, -90], [-25, 90]]
};

function insideArea(geojsonList, area) {
  return geojsonList.every(geojson => {
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
    const features = this.helpers.getFeatures(geojsonList);
    const tileObject = {};
    for (const [i, geojson] of features.linestrings.entries()) {
      const tileIndex = geojsonvt(geojson);
      const tile = tileIndex.getTile(z, x, y);
      if (tile) {
        tileObject[`linestring-${i}`] = tile;
      }
    }
    for (const [i, geojson] of features.polygons.entries()) {
      const tileIndex = geojsonvt(geojson);
      const tile = tileIndex.getTile(z, x, y);
      if (tile) {
        tileObject[`polygon-${i}`] = tile;
      }
    }
    return zlib.gzipSync(vtpbf.fromGeojsonVt(tileObject, { version: 2 }));
  } catch (error) {
    return Boom.notFound();
  }
}

module.exports = {
  getTileset: getTileset,
  getTile: getTile,
  getTilesetTile: getTilesetTile,
  transformCoordinates: transformCoordinates
};
