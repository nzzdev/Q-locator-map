const turf = require("@turf/turf");
const hasha = require("hasha");
const mbtiles = require("@mapbox/mbtiles");

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
  return `${
    toolRuntimeConfig.toolBaseUrl
  }/styles/${id}?appendItemToPayload=${qId}&qId=${qId}&toolRuntimeConfig=${encodeURIComponent(
    JSON.stringify(toolRuntimeConfig)
  )}`;
}

async function getMapConfig(item, toolRuntimeConfig, qId) {
  const mapConfig = {};
  const geojsonList = item.geojsonList;
  if (
    geojsonList.length === 1 &&
    geojsonList[0].type === "Feature" &&
    geojsonList[0].geometry.type === "Point"
  ) {
    mapConfig.center = turf.center(geojsonList[0]).geometry.coordinates;
  } else {
    const bboxPolygons = geojsonList.map(geojson => {
      return turf.bboxPolygon(turf.bbox(geojson));
    });

    mapConfig.bounds = turf.bbox(turf.featureCollection(bboxPolygons));
    mapConfig.center = turf.center(
      turf.featureCollection(bboxPolygons)
    ).geometry.coordinates;
  }

  mapConfig.styleUrl = await getStyleUrl(
    item.options.baseLayer,
    toolRuntimeConfig,
    qId
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

function getMbtiles() {
  if (process.env.MBTILES_PATH) {
    const mbtilesPath = `${process.env.MBTILES_PATH}?mode=ro`;
    return new Promise(function(resolve, reject) {
      new mbtiles(mbtilesPath, function(err, mbtiles) {
        if (err) {
          reject(err);
        } else {
          resolve(mbtiles);
        }
      });
    });
  }
  return {};
}

module.exports = {
  getMapConfig: getMapConfig,
  getExactPixelWidth: getExactPixelWidth,
  getHash: getHash,
  getMbtiles: getMbtiles
};
