const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const hasha = require("hasha");
const turf = require("@turf/turf");
const fetch = require("node-fetch");
const Boom = require("@hapi/boom");
const fontnik = require("fontnik");
const glob = require("glob");
const tilesHelpers = require("./tiles.js");
const deepmerge = require("deepmerge");
const util = require("util");
const vtquery = util.promisify(require("@mapbox/vtquery"));

async function getConfig(item, itemStateInDb, toolRuntimeConfig, data) {
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
    const bboxPolygons = geojsonList.map((geojson) => {
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
  config.styleConfig = getStyleConfig(toolRuntimeConfig.styleConfig);
  config.tilesets = data.tilesets;
  config.fontHash = await getHash(toolRuntimeConfig.styleConfig.fonts);
  config.spriteHash = data.sprites["1x"].hash;

  config.mapboxAccessToken = process.env.MAPBOX_ACCESS_TOKEN;
  config.toolBaseUrl = toolRuntimeConfig.toolBaseUrl;
  config.styles = getStyles(data.styles);
  return config;
}

function getStyles(styles) {
  const styleHashes = {};
  for (let [key, value] of Object.entries(styles)) {
    styleHashes[key] = {
      hash: value.hash,
    };
  }

  return styleHashes;
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

async function getFont(hash, fontBaseUrl, fontName, start, end) {
  const response = await fetch(`${fontBaseUrl}${fontName}.otf`);
  if (response.ok) {
    const fontFile = await response.buffer();
    return await new Promise((resolve, reject) => {
      fontnik.range(
        {
          font: fontFile,
          start: start,
          end: end,
        },
        (error, glyphs) => {
          if (error) {
            reject(Boom.notFound());
          } else {
            fontnik.composite([glyphs], (error, glyphsPBF) => {
              if (error) {
                reject(Boom.notFound());
              } else {
                zlib.gzip(glyphsPBF, (error, compressedPBF) => {
                  if (error) {
                    reject(Boom.notFound());
                  } else {
                    resolve(compressedPBF);
                  }
                });
              }
            });
          }
        }
      );
    });
  }
}

async function getRegionSuggestions(lng, lat) {
  try {
    const regionSuggestions = [];
    const wikidataIds = new Set();
    const options = {
      radius: 50000,
      limit: 5,
      geometry: "polygon",
      dedupe: true,
    };

    const result = await vtquery(this.tiles, [lng, lat], options);
    for (let feature of result.features) {
      wikidataIds.add(feature.properties.wikidata);
    }

    for (let wikidataId of wikidataIds.values()) {
      const region = await this.server.methods.getGeodataGeojson(wikidataId);

      if (region && region.properties) {
        let label = "";
        if (region.properties.name_de) {
          label = region.properties.name_de;
        } else if (region.properties.name) {
          label = region.properties.name;
        }
        regionSuggestions.push({ id: wikidataId, label: label });
      }
    }

    return regionSuggestions;
  } catch (error) {
    return Boom.notFound();
  }
}

async function getHash(data) {
  return await hasha(JSON.stringify(data), {
    algorithm: "md5",
  });
}

async function getFeatures(geojsonList, itemStateInDb, labelsBelowMap) {
  let pointFeatures = [];
  let linestringFeatures = [];
  let polygonFeatures = [];
  const featureCollections = geojsonList.filter(
    (geojson) => geojson.type === "FeatureCollection"
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
    (geojson) =>
      geojson.type === "Feature" &&
      ["Point", "MultiPoint"].includes(geojson.geometry.type)
  );
  pointFeatures = pointFeatures.concat(points).map((feature, index) => {
    return {
      id: `point-${index}`,
      geojson: feature,
    };
  });

  if (labelsBelowMap) {
    let index = 1;
    for (let pointFeature of pointFeatures) {
      if (
        pointFeature.geojson.properties &&
        !["country", "capital", "city", "water", "label"].includes(
          pointFeature.geojson.properties.type
        )
      ) {
        pointFeature.geojson.properties.type = "number";
        pointFeature.geojson.properties.index = index;
        index++;
      }
    }
  }

  const linestrings = geojsonList.filter(
    (geojson) =>
      geojson.type === "Feature" &&
      ["LineString", "MultiLineString"].includes(geojson.geometry.type)
  );
  linestringFeatures = linestringFeatures
    .concat(linestrings)
    .map((feature, index) => {
      return {
        id: `linestring-${index}`,
        geojson: !itemStateInDb ? feature : undefined,
        properties: feature.properties,
      };
    });

  const polygons = geojsonList.filter(
    (geojson) =>
      geojson.type === "Feature" &&
      ["Polygon", "MultiPolygon"].includes(geojson.geometry.type)
  );
  polygonFeatures = polygonFeatures.concat(polygons).map((feature, index) => {
    return {
      id: `polygon-${index}`,
      geojson: !itemStateInDb ? feature : undefined,
    };
  });

  const features = {
    points: pointFeatures,
    linestrings: linestringFeatures,
    polygons: polygonFeatures,
  };

  features.hash = await getHash(geojsonList);
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
    .map((f) => {
      return {
        id: path.basename(f).replace(".svg", ""),
        svg: fs.readFileSync(f).toString("utf8"),
      };
    });
}

function getStyleConfig(styleConfig) {
  let defaultStyleConfig = {
    colors: {
      basic: {
        background: "#f0f0f2",
        water: "#cee9f2",
        waterText: "#0093bf",
        waterway: "#add8e6",
        forest: "#99c7a3",
        road: "#dfe0e5",
        railway: "#d8d9db",
        building: "#e3e3e8",
        text: "#92929e",
        boundaryCountry: "#a88ea8",
        boundaryState: "#c9c4e0",
        boundaryCommunity: "#d4c1ee",
      },
      minimal: {
        background: "#f0f0f2",
        water: "#cee1e6",
        waterText: "#0093bf",
        waterway: "#d6d6d6",
        forest: "#e6e9e5",
        road: "#f5f5f5",
        railway: "#d8d8d8",
        building: "#cbcbcb",
        text: "#92929e",
        boundary: "#cfcfd6",
      },
      nature: {
        background: "#edece1",
        water: "#cee9f2",
        waterText: "#0093bf",
        waterway: "#add8e6",
        forest: "#99c7a3",
        road: "#dbdad1",
        railway: "#d9d9d9",
        building: "#dbdad1",
        text: "#92929e",
        boundary: "#b6b6be",
        hillshadeOpacity: 0.2,
      },
      satellite: {
        background: "#f0f0f2",
        water: "#cee1e6",
        waterText: "#0093bf",
        waterway: "#d6d6d6",
        forest: "#e6e9e5",
        road: "#f5f5f5",
        railway: "#d8d8d8",
        building: "#cbcbcb",
        text: "#92929e",
        boundary: "#ffffff",
      },
    },
    markers: {
      textHaloWidth: 1,
      textBlurWidth: 0.1,
      textLetterSpacing: 0.2,
      textTransform: "none",
      textAnchor: {
        stops: [
          [7.99, "left"],
          [8, "center"],
        ],
      },
      textJustify: "left",
      textOffset: [0, 0],
      iconSize: 1,
      iconMarker: {
        textColorIconMarker: "#05032d",
        textHaloColorIconMarker: "#ffffff",
        textSizeIconMarker: 14,
        textFontIconMarker: ["{fontSansMedium}"],
      },
      country: {
        textSizeCountry: 14,
        textColorCountry: "#6e6e7e",
        textTransformCountry: "none",
      },
      capital: {
        textSizeCapital: 15,
        textTranslateCapital: [10, 0],
        iconImageCapital: {
          stops: [
            [7.99, "capital"],
            [8, ""],
          ],
        },
      },
      city: {
        textSizeCity: 13,
        textTranslateCity: [7, 0],
        iconImageCity: {
          stops: [
            [7.99, "city"],
            [8, ""],
          ],
        },
      },
      label: {
        textTransformLabel: "uppercase",
      },
      line: {
        colorLine: "#c31906",
        widthLine: 2,
        opacityLine: 1,
        dashedLine: [1, 3],
      },
      polygon: {
        fillColorPolygon: "#c31906",
        outlineWidthPolygon: 0,
        opacityPolygon: 0.35,
      },
    },
    highlightRegion: {
      highlightCountryColor: "#ffffff",
      highlightRegionColor: "#d7cddc",
    },
    minimap: {
      hasShadow: true,
      landColor: "#ffffff",
      textColor: "#6e6e7e",
      bboxColor: "#000000",
      textSize: 12,
      globe: {
        width: 90,
        landOutlineColor: "#b6b6be",
        landOutlineWidth: 0.5,
        waterColor: "#cee9f2",
      },
      region: {
        width: 120,
        minWidth: 40,
        landOutlineColor: "#b6b6be",
        landOutlineWidth: 0.5,
      },
    },
    scale: {
      textSize: 11,
      textColor: "#6e6e7e",
      textHaloWidth: 1,
      borderWidth: 1.5,
    },
    aspectRatioBreakpoint: 450,
    hasAttribution: true,
  };

  return deepmerge(defaultStyleConfig, styleConfig, {
    arrayMerge: (destinationArray, sourceArray, options) => sourceArray,
  });
}

function getMaxCache() {
  const ONE_YEAR = 60 * 60 * 24 * 365;
  return `max-age=${ONE_YEAR},s-maxage=${ONE_YEAR},stale-while-revalidate=${ONE_YEAR},stale-if-error=${ONE_YEAR},immutable`;
}

module.exports = {
  getConfig: getConfig,
  getStyleConfig: getStyleConfig,
  getExactPixelWidth: getExactPixelWidth,
  getFont: getFont,
  getRegionSuggestions: getRegionSuggestions,
  getFeatures: getFeatures,
  getNumberMarkers: getNumberMarkers,
  getHash: getHash,
  getMaxCache: getMaxCache,
};
