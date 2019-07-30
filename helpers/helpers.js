const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const turf = require("@turf/turf");
const hasha = require("hasha");
const mbtiles = require("@mapbox/mbtiles");
const vega = require("vega");
const fetch = require("node-fetch");
const Boom = require("@hapi/boom");
const fontnik = require("fontnik");
const vtpbf = require("vt-pbf");
const geojsonvt = require("geojson-vt");
const glyphCompose = require("@mapbox/glyph-pbf-composite");
const minimapRegionVegaSpec = require("../resources/config/minimapRegionVegaSpec.json");
const minimapGlobeVegaSpec = require("../resources/config/minimapGlobeVegaSpec.json");

async function getHash(item, toolRuntimeConfig) {
  // This hash ensures that the response of the endpoint request can be cached forever
  // It changes as soon as the item or toolRuntimeConfig change
  return await hasha(
    JSON.stringify({
      item: item,
      toolRuntimeConfig: toolRuntimeConfig
    }),
    {
      algorithm: "md5"
    }
  );
}

async function getStyleUrl(id, toolRuntimeConfig, qId) {
  if (qId) {
    return `${
      toolRuntimeConfig.toolBaseUrl
    }/styles/${id}?appendItemToPayload=${qId}&qId=${qId}&toolBaseUrl=${
      toolRuntimeConfig.toolBaseUrl
    }`;
  } else {
    return `${toolRuntimeConfig.toolBaseUrl}/styles/${id}?toolBaseUrl=${
      toolRuntimeConfig.toolBaseUrl
    }`;
  }
}

async function getMinimapMarkup(minimapOptions, mapConfig, toolRuntimeConfig) {
  let height = 100;
  let width = 100;
  let spec;
  if (minimapOptions.type === "region") {
    height = 150;
    width = 150;
    spec = JSON.parse(JSON.stringify(minimapRegionVegaSpec));
    const geoDataUrl = `${toolRuntimeConfig.toolBaseUrl}/geodata/${
      minimapOptions.region
    }.geojson`;

    const response = await fetch(geoDataUrl);
    if (response.ok) {
      const region = await response.json();
      const center = turf.getCoord(turf.centroid(region));
      const bbox = turf.bbox(region);
      const distance = turf.distance([bbox[0], bbox[1]], [bbox[2], bbox[3]], {
        units: "radians"
      });
      const scaleFactor = height / distance;

      spec.signals.push({
        name: "scaleFactor",
        value: scaleFactor
      });

      spec.signals.push({
        name: "rotate0",
        value: center[0] * -1
      });

      spec.signals.push({
        name: "rotate1",
        value: center[1] * -1
      });

      spec.data.push({
        name: "region",
        values: region,
        format: {
          type: "json"
        }
      });
    }
  } else {
    spec = JSON.parse(JSON.stringify(minimapGlobeVegaSpec));
    const geoDataUrl = `${
      toolRuntimeConfig.toolBaseUrl
    }/geodata/Q11081619.geojson`;

    const response = await fetch(geoDataUrl);
    if (response.ok) {
      const region = await response.json();

      spec.signals.push({
        name: "rotate0",
        value: mapConfig.center[0] * -1
      });
      spec.signals.push({
        name: "rotate1",
        value: mapConfig.center[1] * -1
      });
      spec.data.push({
        name: "world",
        values: region,
        format: {
          type: "json"
        }
      });
      let bbox;
      if (mapConfig.bounds) {
        bbox = turf.bboxPolygon(mapConfig.bounds);
      } else {
        bbox = turf.point(mapConfig.center);
      }
      spec.data.push({
        name: "bbox",
        values: bbox,
        format: {
          type: "json"
        }
      });
    }
  }
  spec.height = height;
  spec.width = width;
  const view = new vega.View(vega.parse(spec)).renderer("none").initialize();
  view.logLevel(vega.Warn);
  let svg = await view.toSVG();
  // Escape quotation marks (" with \") and forward slashes (</svg> with <\/svg) for serialization of markup in JSON
  svg = svg.replace(/"/g, '\\"');
  svg = svg.replace(/\//g, "\\/");
  return svg;
}

async function getMapConfig(item, toolRuntimeConfig, qId) {
  const mapConfig = {};
  const geojsonList = item.geojsonList;
  if (item.bbox && item.bbox.length === 4) {
    mapConfig.bbox = item.bbox;
    const bottomLeft = [mapConfig.bbox[0], mapConfig.bbox[1]];
    const bottomRight = [mapConfig.bbox[2], mapConfig.bbox[1]];
    const topRight = [mapConfig.bbox[2], mapConfig.bbox[3]];
    mapConfig.aspectRatio =
      turf.distance(bottomRight, topRight) /
      turf.distance(bottomRight, bottomLeft);
  } else if (
    geojsonList.length === 1 &&
    geojsonList[0].type === "Feature" &&
    geojsonList[0].geometry.type === "Point"
  ) {
    mapConfig.center = geojsonList[0].geometry.coordinates;
    mapConfig.zoom = 9;
  } else {
    const bboxPolygons = geojsonList.map(geojson => {
      return turf.bboxPolygon(turf.bbox(geojson));
    });
    mapConfig.bounds = turf.bbox(turf.featureCollection(bboxPolygons));
  }

  mapConfig.styleUrl = await getStyleUrl(
    item.options.baseLayer,
    toolRuntimeConfig,
    qId
  );

  const minimapOptions = item.options.minimapOptions || {};
  if (
    item.options.minimap &&
    (minimapOptions.type === "globe" ||
      (minimapOptions.type === "region" && minimapOptions.region))
  ) {
    mapConfig.minimapMarkup = await getMinimapMarkup(
      minimapOptions,
      mapConfig,
      toolRuntimeConfig
    );
  }
  return mapConfig;
}

function getExactPixelWidth(toolRuntimeConfig) {
  if (!toolRuntimeConfig.size || !Array.isArray(toolRuntimeConfig.size.width)) {
    return undefined;
  }
  for (let width of toolRuntimeConfig.size.width) {
    if (
      width &&
      width.value &&
      width.comparison === "=" &&
      (!width.unit || width.unit === "px")
    ) {
      return width.value;
    }
  }
  return undefined;
}

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

async function getTilesetTile(item, id, z, x, y) {
  try {
    if (id >= 0 && id < item.geojsonList.length) {
      const tileIndex = geojsonvt(item.geojsonList[id]);
      const tile = tileIndex.getTile(z, x, y);
      if (tile) {
        const tileObject = {};
        tileObject[`source-${id}`] = tile;
        return zlib.gzipSync(vtpbf.fromGeojsonVt(tileObject, { version: 2 }));
      } else {
        return Boom.notFound();
      }
    } else {
      return Boom.notFound();
    }
  } catch (error) {
    return Boom.notFound();
  }
}

const fontsDir = `${__dirname}/../resources/fonts/`;
const notoSansRegular = fs.readFileSync(
  path.join(fontsDir, "NotoSans-Regular.ttf")
);
const notoSansBold = fs.readFileSync(path.join(fontsDir, "NotoSans-Bold.ttf"));
const notoSansItalic = fs.readFileSync(
  path.join(fontsDir, "NotoSans-Italic.ttf")
);

function getFontFile(fontName) {
  if (fontName === "Noto Sans Regular") {
    return notoSansRegular;
  } else if (fontName === "Noto Sans Bold") {
    return notoSansBold;
  } else if (fontName === "Noto Sans Italic") {
    return notoSansItalic;
  } else {
    return notoSansRegular;
  }
}

async function getFont(fontName, start, end) {
  const fontFile = getFontFile(fontName);
  return await new Promise((resolve, reject) => {
    fontnik.range(
      {
        font: fontFile,
        start: start,
        end: end
      },
      (error, data) => {
        if (error) {
          reject(Boom.notFound());
        } else {
          const glyph = glyphCompose.combine([data]);
          zlib.gzip(glyph, (error, compressedGlyph) => {
            if (error) {
              reject(Boom.notFound());
            } else {
              resolve(compressedGlyph);
            }
          });
        }
      }
    );
  });
}

function getDefaultGeojsonStyles() {
  return {
    line: {
      stroke: "#c31906",
      "stroke-width": 2,
      "stroke-opacity": 1
    },
    polygon: {
      "stroke-width": 0,
      fill: "#c31906",
      "fill-opacity": 0.35
    }
  };
}

async function getRegionSuggestions(components, countryCode) {
  try {
    const enums = [];
    const enum_titles = [];
    const wikidataIds = new Set();
    for (let [key, value] of components) {
      const geocoderResponse = await this.server.app.geocoder.geocode({
        address: value,
        countryCode: countryCode
      });
      if (
        geocoderResponse.raw.status.code === 200 &&
        geocoderResponse.raw.results.length > 0
      ) {
        for (let geocoderResult of geocoderResponse.raw.results) {
          const wikidataId = geocoderResult.annotations.wikidata;
          if (wikidataId) {
            wikidataIds.add(wikidataId);
          }
        }
      }
    }

    for (let wikidataId of wikidataIds.values()) {
      const geodataResponse = await this.server.inject(
        `/geodata/${wikidataId}`
      );
      if (geodataResponse.statusCode === 200) {
        const version = geodataResponse.result.versions.pop();
        enum_titles.push(version.label);
        enums.push(wikidataId);
      }
    }

    return {
      enums: enums,
      enum_titles: enum_titles
    };
  } catch (error) {
    return Boom.notFound();
  }
}

module.exports = {
  getMapConfig: getMapConfig,
  getExactPixelWidth: getExactPixelWidth,
  getHash: getHash,
  getTileset: getTileset,
  getTile: getTile,
  getTilesetTile: getTilesetTile,
  getFont: getFont,
  getDefaultGeojsonStyles: getDefaultGeojsonStyles,
  getRegionSuggestions: getRegionSuggestions
};
