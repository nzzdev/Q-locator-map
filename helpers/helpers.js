const turf = require("@turf/turf");

function getMapConfig(item) {
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

    const bbox = turf.bbox(turf.featureCollection(bboxPolygons));
    mapConfig.bounds = bbox;
    mapConfig.center = turf.center(bbox);
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

module.exports = {
  getMapConfig: getMapConfig,
  getExactPixelWidth: getExactPixelWidth
};
