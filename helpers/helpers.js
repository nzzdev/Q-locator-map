const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const turf = require("@turf/turf");
const Boom = require("@hapi/boom");
const fontnik = require("fontnik");
const glyphCompose = require("@mapbox/glyph-pbf-composite");
const styleHelpers = require("./styles.js");
const minimapHelpers = require("./minimap.js");
const tilesHelpers = require("./tiles.js");

async function getMapConfig(item, toolRuntimeConfig, qId) {
  const mapConfig = {};
  let geojsonList = item.geojsonList;
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
    geojsonList = tilesHelpers.transformCoordinates(geojsonList);
    const bboxPolygons = geojsonList.map(geojson => {
      return turf.bboxPolygon(turf.bbox(geojson));
    });
    mapConfig.bounds = turf.bbox(turf.featureCollection(bboxPolygons));
  }

  mapConfig.style = styleHelpers.getStyle(
    item.options.baseLayer.style,
    item,
    toolRuntimeConfig.toolBaseUrl,
    qId
  );

  const minimapOptions = item.options.minimap.options;
  if (
    item.options.minimap.showMinimap &&
    (minimapOptions.type === "globe" ||
      (minimapOptions.type === "region" &&
        minimapOptions.region &&
        minimapOptions.region !== ""))
  ) {
    mapConfig.minimapMarkup = await minimapHelpers.getMinimap(
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
  getFont: getFont,
  getRegionSuggestions: getRegionSuggestions
};
