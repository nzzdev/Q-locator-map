const points = require("./features.js").points;
const features = require("./features.js").features;
const labelingPoints = require("./features.js").labelingPoints;

function createMapPoint() {
  const item = {
    title:
      "FIXTURE: basic map with one point (top/heavyLabel) and default options",
    subtitle: "subtitle",
    sources: [],
    notes: "Standardfall: Karte mit einem Punkt",
    acronym: "abc",
    geojsonList: [points.bucharestHeavyTop],
    options: {
      baseLayer: {
        style: "basic",
        layers: {
          label: true
        }
      },
      minimap: {
        showMinimap: true,
        options: {
          type: "globe",
          position: "bottom-right"
        }
      },
      labelsBelowMap: false,
      showLegend: true
    }
  };
  return item;
}

function createMapFeature() {
  const item = {
    title:
      "FIXTURE: basic map with one feature (line string two points) and default options",
    subtitle: "subtitle",
    sources: [],
    notes: "Eine Linie verbindet zwei Punkte",
    acronym: "abc",
    geojsonList: [features.lineSofiaBucharest],
    options: {
      baseLayer: {
        style: "basic",
        layers: {
          label: true
        }
      },
      minimap: {
        showMinimap: true,
        options: {
          type: "globe",
          position: "bottom-right"
        }
      },
      labelsBelowMap: false,
      showLegend: true
    }
  };
  return item;
}

function createMapFeatureCollection() {
  const item = {
    title:
      "FIXTURE: basic map with one feature collection (two polygons) and default options",
    subtitle: "subtitle",
    sources: [],
    notes: "Zwei Polygone stehen im Raum",
    acronym: "abc",
    geojsonList: [
      {
        type: "FeatureCollection",
        features: [features.orangePolygon, features.greenPolygon]
      }
    ],
    options: {
      baseLayer: {
        style: "basic",
        layers: {
          label: true
        }
      },
      minimap: {
        showMinimap: true,
        options: {
          type: "globe",
          position: "bottom-right"
        }
      },
      labelsBelowMap: false,
      showLegend: true
    }
  };
  return item;
}

function createMapPoints() {
  const item = {
    title:
      "FIXTURE: basic map with 10 points (all label options) and default options",
    subtitle: "subtitle",
    sources: [],
    notes: "Karte mit mehreren Punkten",
    acronym: "abc",
    geojsonList: [],
    options: {
      baseLayer: {
        style: "nature",
        layers: {
          label: true
        }
      },
      minimap: {
        showMinimap: true,
        options: {
          type: "globe",
          position: "bottom-right"
        }
      },
      labelsBelowMap: false,
      showLegend: true
    }
  };
  Object.keys(points).forEach(point => {
    item.geojsonList.push(points[point]);
  });
  return item;
}

function createMapPointsLabelsBelow() {
  const item = createMapPoints();
  item.title =
    "FIXTURE: map labels below map with 10 points (all label options)";
  item.subtitle = "subtitle";
  item.options.labelsBelowMap = true;
  return item;
}

function createMapPointsLabelsBelowOneRow() {
  const item = createMapPoints();
  item.title =
    "FIXTURE: map labels below map in one row with 10 points (all label options)";
  item.subtitle = "subtitle";
  item.options.labelsBelowMap = true;
  item.options.labelsBelowMapOneRow = true;
  return item;
}

function createMapFeatures() {
  const item = {
    title: "FIXTURE: basic map with several features and default options",
    subtitle: "subtitle",
    sources: [],
    notes: "Linien und Polygone",
    acronym: "abc",
    geojsonList: [],
    options: {
      baseLayer: {
        style: "nature",
        layers: {
          label: false
        }
      },
      minimap: {
        showMinimap: true,
        options: {
          type: "globe",
          position: "bottom-right"
        }
      },
      labelsBelowMap: false,
      showLegend: true
    }
  };
  Object.keys(features).forEach(feature => {
    item.geojsonList.push(features[feature]);
  });
  return item;
}

function createMapFeatureCollections() {
  const item = {
    title:
      "FIXTURE: basic map with two feature collections and default options",
    subtitle: "subtitle",
    sources: [],
    notes: "Zwei Polygone stehen im Raum und zwei Linien dazu",
    acronym: "abc",
    geojsonList: [
      {
        type: "FeatureCollection",
        features: [features.orangePolygon, features.greenPolygon]
      },
      {
        type: "FeatureCollection",
        features: [features.lineSarajevoZagreb, features.lineTiranaYerevan]
      }
    ],
    options: {
      baseLayer: {
        style: "satellite",
        layers: {
          label: true
        }
      },
      minimap: {
        showMinimap: true,
        options: {
          type: "globe",
          position: "bottom-right"
        }
      },
      labelsBelowMap: false,
      showLegend: true
    }
  };
  return item;
}

function createMapPointsNoMinimap() {
  const item = createMapPoints();
  item.title = "FIXTURE: map with 10 points and no minimap";
  item.subtitle = "subtitle";
  item.options.minimap = {
    showMinimap: false,
    options: {
      type: "globe",
      position: "bottom-right"
    }
  };
  return item;
}

function createMapFeaturesMinimapManual() {
  const item = createMapFeatures();
  item.title =
    "FIXTURE: map with several features and manuel zoom level and zoom offset minimap";
  item.subtitle = "subtitle";
  return item;
}

function createLabelingPoints() {
  const item = {
    title:
      "FIXTURE: basic map with all marker types for labelling places in map and default options",
    subtitle: "subtitle",
    sources: [],
    notes:
      "Um z.B. für bestimmte Länder, Orte oder Gewässer die NZZ-Schreibweise zu verwenden, können diese Markertypen verwendet werden",
    acronym: "abc",
    geojsonList: [],
    options: {
      baseLayer: {
        style: "basic",
        layers: {
          label: true
        }
      },
      minimap: {
        showMinimap: false,
        options: {
          type: "globe",
          position: "bottom-right"
        }
      },
      labelsBelowMap: false,
      showLegend: true
    }
  };
  Object.keys(labelingPoints).forEach(point => {
    item.geojsonList.push(labelingPoints[point]);
  });
  return item;
}

function createMapLayerStreetsFew() {
  const item = createMapPoint(); // change as it fits your needs to other feature(s)
  item.title = "FIXTURE: map with base layer streets with few labels";
  item.subtitle = "subtitle";
  item.options.baseLayer = {
    style: "basic",
    layers: {
      label: true
    }
  };
  return item;
}

function createMapLayerStreetsNo() {
  const item = createMapPoint(); // change as it fits your needs to other feature(s)
  item.title = "FIXTURE: map with base layer streets without labels";
  item.subtitle = "subtitle";
  item.options.baseLayer = {
    style: "basic",
    layers: {
      label: true
    }
  };
  return item;
}

function createMapLayerTerrain() {
  const item = createMapPoint(); // change as it fits your needs to other feature(s)
  item.title = "FIXTURE: map with base layer terrain";
  item.subtitle = "subtitle";
  item.options.baseLayer = {
    style: "basic",
    layers: {
      label: true
    }
  };
  return item;
}

function createMapLayerSatellite() {
  const item = createMapPoint(); // change as it fits your needs to other feature(s)
  item.title = "FIXTURE: map with base layer satellite";
  item.subtitle = "subtitle";
  item.options.baseLayer = {
    style: "basic",
    layers: {
      label: true
    }
  };
  return item;
}

function showAcronym() {
  const item = {
    title:
      "FIXTURE: show acronym if one of sources, notes, and geojson feature or a feature collection is present",
    subtitle: "subtitle",
    sources: [],
    notes: "",
    acronym: "abc",
    geojsonList: [
      {
        type: "FeatureCollection",
        features: [features.orangePolygon, features.greenPolygon]
      }
    ],
    options: {
      baseLayer: {
        style: "basic",
        layers: {
          label: true
        }
      },
      minimap: {
        showMinimap: true,
        options: {
          type: "globe",
          position: "bottom-right"
        }
      },
      labelsBelowMap: false,
      showLegend: true
    }
  };
  return item;
}

function dontShowAcronym() {
  const item = {
    title:
      "FIXTURE: don't show acronym if sources, notes are not defined or only point features are present",
    subtitle: "subtitle",
    sources: [],
    notes: "",
    acronym: "abc",
    geojsonList: [points.bucharestHeavyTop],
    options: {
      baseLayer: {
        style: "basic",
        layers: {
          label: true
        }
      },
      minimap: {
        showMinimap: true,
        options: {
          type: "globe",
          position: "bottom-right"
        }
      },
      labelsBelowMap: false,
      showLegend: true
    }
  };
  return item;
}

function antimeridian() {
  const item = {
    title:
      "FIXTURE: show pacific view if one of the features is within the pacific area",
    subtitle: "subtitle",
    sources: [],
    notes: "",
    acronym: "abc",
    geojsonList: [points.honoluluHeavyTop, points.tokioHeavyTop],
    options: {
      baseLayer: {
        style: "basic",
        layers: {
          label: true
        }
      },
      minimap: {
        showMinimap: true,
        options: {
          type: "globe",
          position: "bottom-right"
        }
      },
      labelsBelowMap: false,
      showLegend: true
    }
  };
  return item;
}

function labelPlacementTypePointHeavyLabel() {
  const item = {
    title:
      "FIXTURE: all label placement options using marker type pointHeavyLabel",
    subtitle: "subtitle",
    sources: [],
    notes: "",
    acronym: "abc",
    geojsonList: [
      points.zurichHeavyTop,
      points.zurichHeavyBottom,
      points.zurichHeavyLeft,
      points.zurichHeavyRight,
      points.zurichHeavyTopLeft,
      points.zurichHeavyTopRight,
      points.zurichHeavyBottomLeft,
      points.zurichHeavyBottomRight
    ],
    options: {
      baseLayer: {
        style: "basic",
        layers: {
          label: true
        }
      },
      minimap: {
        showMinimap: false,
        options: {
          type: "globe",
          position: "bottom-right"
        }
      },
      labelsBelowMap: false,
      showLegend: true
    }
  };
  return item;
}

function labelPlacementTypePointLightLabel() {
  const item = {
    title:
      "FIXTURE: all label placement options using marker type pointLightLabel",
    subtitle: "subtitle",
    sources: [],
    notes: "",
    acronym: "abc",
    geojsonList: [
      points.zurichHeavyTop,
      points.zurichHeavyBottom,
      points.zurichHeavyLeft,
      points.zurichHeavyRight,
      points.zurichHeavyTopLeft,
      points.zurichHeavyTopRight,
      points.zurichHeavyBottomLeft,
      points.zurichHeavyBottomRight
    ].map(geojson => {
      geojson.properties.type = "pointLightLabel";
      return geojson;
    }),
    options: {
      baseLayer: {
        style: "basic",
        layers: {
          label: true
        }
      },
      minimap: {
        showMinimap: false,
        options: {
          type: "globe",
          position: "bottom-right"
        }
      },
      labelsBelowMap: false,
      showLegend: true
    }
  };
  return item;
}

function labelPlacementTypeEvent() {
  const item = {
    title: "FIXTURE: all label placement options using marker type event",
    subtitle: "subtitle",
    sources: [],
    notes: "",
    acronym: "abc",
    geojsonList: [
      points.zurichHeavyTop,
      points.zurichHeavyBottom,
      points.zurichHeavyLeft,
      points.zurichHeavyRight,
      points.zurichHeavyTopLeft,
      points.zurichHeavyTopRight,
      points.zurichHeavyBottomLeft,
      points.zurichHeavyBottomRight
    ].map(geojson => {
      geojson.properties.type = "event";
      return geojson;
    }),
    options: {
      baseLayer: {
        style: "basic",
        layers: {
          label: true
        }
      },
      minimap: {
        showMinimap: false,
        options: {
          type: "globe",
          position: "bottom-right"
        }
      },
      labelsBelowMap: false,
      showLegend: true
    }
  };
  return item;
}

module.exports = {
  basicPoint: createMapPoint,
  basicFeature: createMapFeature,
  basicFeatureCollection: createMapFeatureCollection,
  basicPoints: createMapPoints,
  basicFeatures: createMapFeatures,
  basicFeatureCollections: createMapFeatureCollections,
  pointsLabelsBelow: createMapPointsLabelsBelow,
  pointsLabelsBelowOneRow: createMapPointsLabelsBelowOneRow,
  pointsNoMinimap: createMapPointsNoMinimap,
  featuresManualMinimap: createMapFeaturesMinimapManual,
  labelingPoints: createLabelingPoints,
  baseLayerStreetFewLabels: createMapLayerStreetsFew,
  baseLayerStreetNoLabels: createMapLayerStreetsNo,
  baseLayerTerrain: createMapLayerTerrain,
  baseLayerSatellite: createMapLayerSatellite,
  showAcronym: showAcronym,
  dontShowAcronym: dontShowAcronym,
  antimeridian: antimeridian,
  labelPlacementTypePointHeavyLabel: labelPlacementTypePointHeavyLabel,
  labelPlacementTypePointLightLabel: labelPlacementTypePointLightLabel,
  labelPlacementTypeEvent: labelPlacementTypeEvent
};
