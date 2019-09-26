const tilesHelpers = require("../helpers/tiles.js");
const turf = require("@turf/turf");

function getMigratedFeature(feature) {
  // Point
  if (
    feature &&
    feature.geometry &&
    feature.geometry.type &&
    feature.geometry.type === "Point"
  ) {
    if (feature.properties && feature.properties.type) {
      if (
        ["pointHeavyLabel", "pointLightLabel", "pointOnly"].includes(
          feature.properties.type
        )
      ) {
        if (
          feature.properties.type === "pointOnly" &&
          feature.properties.label !== ""
        ) {
          feature.properties.label = "";
        }
        feature.properties.type = "point";
      } else if (
        feature.properties.type === "label" &&
        feature.properties.labelPosition !== "top"
      ) {
        feature.properties.labelPosition = "top";
      } else if (
        feature.properties.type === "epicenter" &&
        feature.properties.label !== ""
      ) {
        feature.properties.label = "";
        if (feature.properties.labelPosition !== "top") {
          feature.properties.labelPosition = "top";
        }
      }
    }
  }

  return feature;
}

module.exports.migrate = function(item) {
  let result = {
    isChanged: false
  };

  // geojsonList
  if (item.geojsonList && typeof item.geojsonList === "object") {
    item.geojsonList = item.geojsonList.map(geojson => {
      if (!geojson.hasOwnProperty("type")) {
        return geojson;
      }
      if (geojson.type === "FeatureCollection") {
        geojson.features = geojson.features.map(feature => {
          if (!feature.hasOwnProperty("type")) {
            return feature;
          }

          return getMigratedFeature(feature);
        });
        return geojson;
      }
      if (geojson.type === "Feature") {
        return getMigratedFeature(geojson);
      }
    });

    // useForInitialView property
    const allFeaturesHaveUseForInitialView = item.geojsonList.every(geojson => {
      if (
        geojson.type === "Feature" &&
        geojson.properties &&
        geojson.properties.useForInitialView === true
      ) {
        return true;
      } else if (geojson.type === "FeatureCollection") {
        return geojson.features.every(feature => {
          if (
            geojson.type === "Feature" &&
            geojson.properties &&
            geojson.properties.useForInitialView === true
          ) {
            return true;
          }
          return false;
        });
      }
      return false;
    });
    if (!allFeaturesHaveUseForInitialView) {
      const geojsonList = tilesHelpers.transformCoordinates(item.geojsonList);
      const bboxPolygons = geojsonList
        .filter(geojson => {
          if (
            geojson.type === "Feature" &&
            geojson.properties &&
            geojson.properties.useForInitialView === true
          ) {
            return geojson;
          } else if (geojson.type === "FeatureCollection") {
            geojson.features = geojson.features.filter(feature => {
              if (
                feature.type === "Feature" &&
                feature.properties &&
                feature.properties.useForInitialView === true
              ) {
                return feature;
              }
            });
            if (geojson.features.length > 0) {
              return geojson;
            }
          }
        })
        .map(geojson => {
          return turf.bboxPolygon(turf.bbox(geojson));
        });
      item.options.dimension = {
        bbox: turf.bbox(turf.featureCollection(bboxPolygons)),
        useDefaultAspectRatio: true
      };
    }

    result.isChanged = true;
  }

  // baseLayer option
  if (item.options && typeof item.options.baseLayer === "string") {
    if (item.options.baseLayer === "") {
      item.options.baseLayer = {};
    } else {
      let style;
      let label;
      if (
        ["streets", "streetsFewLabels", "streetsNoLabels"].includes(
          item.options.baseLayer
        )
      ) {
        style = "basic";
        label = true;
        if (item.options.baseLayer === "streetsNoLabels") {
          label = false;
        }
      } else if (
        ["terrain", "terrainNoLabels"].includes(item.options.baseLayer)
      ) {
        style = "nature";
        label = true;
        if (item.options.baseLayer === "terrainNoLabels") {
          label = false;
        }
      } else if (["aerial"].includes(item.options.baseLayer)) {
        style = "satellite";
      } else {
        style = "basic";
      }
      item.options.baseLayer = {
        style: style,
        layers: {
          label: label
        }
      };
    }
    result.isChanged = true;
  }

  // minimap option
  if (item.options && typeof item.options.minimap === "boolean") {
    item.options.minimap = {
      showMinimap: item.options.minimap,
      options: {
        type: "globe",
        position: "bottom-right"
      }
    };

    result.isChanged = true;
  }

  // minimapInitialZoomOffset option
  if (item.options && Number.isInteger(item.options.minimapInitialZoomOffset)) {
    delete item.options.minimapInitialZoomOffset;
    result.isChanged = true;
  }

  if (item.options && Number.isInteger(item.options.initialZoomLevel)) {
    if (item.options.initialZoomLevel === -1) {
      delete item.options.initialZoomLevel;
    } else if (item.options.initialZoomLevel === 0) {
      item.options.initialZoomLevel = 1;
    } else if (item.options.initialZoomLevel === 2) {
      item.options.initialZoomLevel = item.options.initialZoomLevel - 1;
    } else if (item.options.initialZoomLevel > 2) {
      item.options.initialZoomLevel = item.options.initialZoomLevel - 2;
    }
    result.isChanged = true;
  }

  result.item = item;
  return result;
};
