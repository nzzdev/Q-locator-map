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

    mapConfig.bounds = turf.bbox(turf.featureCollection(bboxPolygons));
  }

  return mapConfig;
}

module.exports = {
  getMapConfig: getMapConfig
};
