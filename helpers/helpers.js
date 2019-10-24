const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const hasha = require("hasha");
const turf = require("@turf/turf");
const fetch = require("node-fetch");
const Boom = require("@hapi/boom");
const fontnik = require("fontnik");
const glyphCompose = require("@mapbox/glyph-pbf-composite");
const glob = require("glob");
const tilesHelpers = require("./tiles.js");

async function getConfig(item, itemStateInDb, toolRuntimeConfig) {
  const config = {};
  let geojsonList = item.geojsonList;

  if (
    item.options.dimension &&
    item.options.dimension.bbox &&
    item.options.dimension.bbox.length === 4
  ) {
    config.bbox = item.options.dimension.bbox;
    if (!item.options.dimension.useDefaultAspectRatio) {
      const bottomLeft = [config.bbox[0], config.bbox[1]];
      const bottomRight = [config.bbox[2], config.bbox[1]];
      const topLeft = [config.bbox[0], config.bbox[3]];
      const width = turf.distance(bottomLeft, topLeft);
      const height = turf.distance(bottomLeft, bottomRight);
      config.aspectRatio = width / height;
    }
  } else if (
    geojsonList.length === 1 &&
    geojsonList[0].type === "Feature" &&
    geojsonList[0].geometry.type === "Point"
  ) {
    config.center = geojsonList[0].geometry.coordinates;
    config.zoom = 9;
  } else {
    geojsonList = tilesHelpers.transformCoordinates(geojsonList);
    const bboxPolygons = geojsonList.map(geojson => {
      return turf.bboxPolygon(turf.bbox(geojson));
    });
    config.bounds = turf.bbox(turf.featureCollection(bboxPolygons));
  }

  if (item.options.initialZoomLevel >= 1) {
    config.zoom = item.options.initialZoomLevel;
  }

  config.features = await getFeatures(
    geojsonList,
    itemStateInDb,
    item.options.labelsBelowMap
  );
  config.defaultGeojsonStyles = getDefaultGeojsonStyles();

  if (toolRuntimeConfig.style) {
    config.style = toolRuntimeConfig.style;
  }
  return config;
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

async function getFont(fontBaseUrl, fontName, start, end) {
  const response = await fetch(`${fontBaseUrl}${fontName}.otf`);
  if (response.ok) {
    const fontFile = await response.buffer();
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

async function getHash(features) {
  return await hasha(JSON.stringify(features), {
    algorithm: "md5"
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

async function getFeatures(geojsonList, itemStateInDb, labelsBelowMap) {
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
  pointFeatures = pointFeatures.concat(points).map((feature, index) => {
    if (labelsBelowMap && feature.properties) {
      feature.properties.type = "number";
      feature.properties.index = index + 1;
    }
    return {
      id: `point-${index}`,
      geojson: feature
    };
  });

  const linestrings = geojsonList.filter(
    geojson =>
      geojson.type === "Feature" &&
      ["LineString", "MultiLineString"].includes(geojson.geometry.type)
  );
  linestringFeatures = linestringFeatures
    .concat(linestrings)
    .map((feature, index) => {
      return {
        id: `linestring-${index}`,
        geojson: !itemStateInDb ? feature : undefined
      };
    });

  const polygons = geojsonList.filter(
    geojson =>
      geojson.type === "Feature" &&
      ["Polygon", "MultiPolygon"].includes(geojson.geometry.type)
  );
  polygonFeatures = polygonFeatures.concat(polygons).map((feature, index) => {
    return {
      id: `polygon-${index}`,
      geojson: !itemStateInDb ? feature : undefined
    };
  });

  const features = {
    points: pointFeatures,
    linestrings: linestringFeatures,
    polygons: polygonFeatures
  };

  features.hash = await getHash(features);
  features.type = itemStateInDb ? "vector" : "geojson";
  features.sourceName = itemStateInDb ? "overlays" : "";
  return features;
}

function getNumberMarkers() {
  return glob
    .sync(
      path.resolve(
        path.join(__dirname, "../resources/sprites/marker/number-*.svg")
      )
    )
    .map(f => {
      return {
        id: path.basename(f).replace(".svg", ""),
        svg: fs.readFileSync(f).toString("utf8")
      };
    });
}

module.exports = {
  getConfig: getConfig,
  getExactPixelWidth: getExactPixelWidth,
  getFont: getFont,
  getRegionSuggestions: getRegionSuggestions,
  getFeatures: getFeatures,
  getDefaultGeojsonStyles: getDefaultGeojsonStyles,
  getNumberMarkers: getNumberMarkers
};
