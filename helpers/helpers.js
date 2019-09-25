const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const turf = require("@turf/turf");
const Boom = require("@hapi/boom");
const fontnik = require("fontnik");
const glyphCompose = require("@mapbox/glyph-pbf-composite");
const styleHelpers = require("./styles.js");
const tilesHelpers = require("./tiles.js");

async function getMapConfig(item, toolRuntimeConfig, qId) {
  const mapConfig = {};
  let geojsonList = item.geojsonList;

  if (item.options.baseLayer.bbox && item.options.baseLayer.bbox.length === 4) {
    mapConfig.bbox = item.options.baseLayer.bbox;
    const bottomLeft = [mapConfig.bbox[0], mapConfig.bbox[1]];
    const bottomRight = [mapConfig.bbox[2], mapConfig.bbox[1]];
    const topLeft = [mapConfig.bbox[0], mapConfig.bbox[3]];
    const width = turf.distance(bottomLeft, topLeft);
    const height = turf.distance(bottomLeft, bottomRight);
    mapConfig.aspectRatio = width / height;
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

  if (item.options.initialZoomLevel >= 1) {
    mapConfig.zoom = item.options.initialZoomLevel;
  }

  mapConfig.features = getFeatures(geojsonList);
  mapConfig.style = await styleHelpers.getStyle(
    item.options.baseLayer.style,
    item,
    toolRuntimeConfig.toolBaseUrl,
    qId,
    mapConfig.features
  );
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
const gtAmericaStandardLight = fs.readFileSync(
  path.join(fontsDir, "GT-America-Standard-Light.otf")
);
const gtAmericaStandardRegular = fs.readFileSync(
  path.join(fontsDir, "GT-America-Standard-Regular.otf")
);
const gtAmericaStandardMedium = fs.readFileSync(
  path.join(fontsDir, "GT-America-Standard-Medium.otf")
);
const pensumProRegular = fs.readFileSync(
  path.join(fontsDir, "PensumPro-Regular.otf")
);
const pensumProRegularItalic = fs.readFileSync(
  path.join(fontsDir, "PensumPro-RegularItalic.otf")
);
const pensumProMedium = fs.readFileSync(
  path.join(fontsDir, "PensumPro-Medium.otf")
);
const pensumProBold = fs.readFileSync(
  path.join(fontsDir, "PensumPro-Bold.otf")
);

const fonts = [
  "GT America Standard Light",
  "GT America Standard Regular",
  "GT America Standard Medium",
  "PensumPro Regular",
  "PensumPro Regular Italic",
  "PensumPro Medium",
  "PensumPro Bold",
  "Noto Sans Regular",
  "Noto Sans Bold",
  "Noto Sans Italic"
];

function getFonts() {
  return fonts;
}

function getFontFile(fontName) {
  if (fontName === fonts[0]) {
    return gtAmericaStandardLight;
  } else if (fontName === fonts[1]) {
    return gtAmericaStandardRegular;
  } else if (fontName === fonts[2]) {
    return gtAmericaStandardMedium;
  } else if (fontName === fonts[3]) {
    return pensumProRegular;
  } else if (fontName === fonts[4]) {
    return pensumProRegularItalic;
  } else if (fontName === fonts[5]) {
    return pensumProMedium;
  } else if (fontName === fonts[6]) {
    return pensumProBold;
  } else if (fontName === fonts[7]) {
    return notoSansRegular;
  } else if (fontName === fonts[8]) {
    return notoSansBold;
  } else if (fontName === fonts[9]) {
    return notoSansItalic;
  } else {
    return gtAmericaStandardRegular;
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

function getFeatures(geojsonList) {
  let pointFeatures = [];
  let linestringFeatures = [];
  let polygonFeatures = [];
  const featureCollections = geojsonList.filter(
    geojson => geojson.type === "FeatureCollection"
  );

  for (const featureCollection of featureCollections) {
    for (const feature of featureCollection.features) {
      if (
        feature.type === "Feature" &&
        ["Point", "MultiPoint"].includes(feature.geometry.type)
      ) {
        pointFeatures.push(feature);
      } else if (
        feature.type === "Feature" &&
        ["LineString", "MultiLineString"].includes(feature.geometry.type)
      ) {
        linestringFeatures.push(feature);
      } else if (
        feature.type === "Feature" &&
        ["Polygon", "MultiPolygon"].includes(feature.geometry.type)
      ) {
        polygonFeatures.push(feature);
      }
    }
  }

  const points = geojsonList.filter(
    geojson =>
      geojson.type === "Feature" &&
      ["Point", "MultiPoint"].includes(geojson.geometry.type)
  );
  pointFeatures = pointFeatures.concat(points);

  const linestrings = geojsonList.filter(
    geojson =>
      geojson.type === "Feature" &&
      ["LineString", "MultiLineString"].includes(geojson.geometry.type)
  );
  linestringFeatures = linestringFeatures.concat(linestrings);

  const polygons = geojsonList.filter(
    geojson =>
      geojson.type === "Feature" &&
      ["Polygon", "MultiPolygon"].includes(geojson.geometry.type)
  );
  polygonFeatures = polygonFeatures.concat(polygons);

  return {
    points: pointFeatures,
    linestrings: linestringFeatures,
    polygons: polygonFeatures
  };
}

module.exports = {
  getMapConfig: getMapConfig,
  getExactPixelWidth: getExactPixelWidth,
  getFont: getFont,
  getFonts: getFonts,
  getRegionSuggestions: getRegionSuggestions,
  getFeatures: getFeatures
};
