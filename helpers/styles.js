const hasha = require("hasha");
const resourcesDir = "../resources/";
const basicStyle = require(`${resourcesDir}styles/basic/style.json`);
const minimalStyle = require(`${resourcesDir}styles/minimal/style.json`);
const natureStyle = require(`${resourcesDir}styles/nature/style.json`);
const satelliteStyle = require(`${resourcesDir}styles/satellite/style.json`);

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

function getStyleJSON(id, toolBaseUrl) {
  let style;
  if (["nature", "terrain", "terrainNoLabels"].includes(id)) {
    style = JSON.stringify(natureStyle);
  } else if (["aerial", "satellite"].includes(id)) {
    style = JSON.stringify(satelliteStyle);
  } else if (["minimal"].includes(id)) {
    style = JSON.stringify(minimalStyle);
  } else {
    style = JSON.stringify(basicStyle);
  }
  style = JSON.parse(
    style
      .replace(/\${mapbox_access_token}/g, process.env.MAPBOX_ACCESS_TOKEN)
      .replace(/\${toolBaseUrl}/g, toolBaseUrl)
  );

  return style;
}

function getStyleFilteredByLayer(style, item) {
  const baseLayer = item.options.baseLayer;
  if (
    baseLayer &&
    baseLayer.layers &&
    Object.keys(baseLayer.layers).length > 0
  ) {
    for (let [layer, value] of Object.entries(baseLayer.layers)) {
      if (layer === "label" && !value) {
        style.layers = style.layers.filter(layer => layer.type !== "symbol");
      }
    }
  }
  return style;
}

async function getHash(features) {
  return await hasha(JSON.stringify(features), {
    algorithm: "md5"
  });
}

function getPointStyleProperties(geojsonProperties) {
  const verticalOffset = 0.6;
  const horizontalOffset = 0.8;
  const properties = {
    textField: "{label}",
    textAnchor: "bottom",
    textJustify: "center",
    textOffset: [0, -verticalOffset],
    textSize: 14,
    textColor: "#05032d",
    textHaloColor: "#ffffff",
    textHaloWidth: 2,
    textFont: ["GT America Standard Medium"],
    iconImage: "circle-11",
    iconSize: 0.9
  };

  if (geojsonProperties.labelPosition === "top") {
    if (geojsonProperties.type === "event") {
      properties.textField = "{label} \n \u2193";
    }
  } else if (geojsonProperties.labelPosition === "bottom") {
    properties.textAnchor = "top";
    properties.textOffset = [0, verticalOffset];
    if (geojsonProperties.type === "event") {
      properties.textField = "\u2191 \n {label}";
    }
  } else if (geojsonProperties.labelPosition === "left") {
    properties.textAnchor = "right";
    properties.textOffset = [-horizontalOffset, 0];
    properties.textJustify = "right";
    if (geojsonProperties.type === "event") {
      properties.textField = "{label} \u2192";
    }
  } else if (geojsonProperties.labelPosition === "right") {
    properties.textAnchor = "left";
    properties.textOffset = [horizontalOffset, 0];
    properties.textJustify = "left";
    if (geojsonProperties.type === "event") {
      properties.textField = "\u2190 {label}";
    }
  } else if (geojsonProperties.labelPosition === "topleft") {
    properties.textAnchor = "bottom-right";
    properties.textOffset = [-horizontalOffset / 2, -verticalOffset / 2];
    properties.textJustify = "right";
    if (geojsonProperties.type === "event") {
      properties.textField = "{label} \n \u2198";
    }
  } else if (geojsonProperties.labelPosition === "topright") {
    properties.textAnchor = "bottom-left";
    properties.textOffset = [horizontalOffset / 2, -verticalOffset / 2];
    properties.textJustify = "left";
    if (geojsonProperties.type === "event") {
      properties.textField = "{label} \n \u2199";
    }
  } else if (geojsonProperties.labelPosition === "bottomleft") {
    properties.textAnchor = "top-right";
    properties.textOffset = [-horizontalOffset / 2, verticalOffset / 2];
    properties.textJustify = "right";
    if (geojsonProperties.type === "event") {
      properties.textField = "{label} \u2197";
    }
  } else if (geojsonProperties.labelPosition === "bottomright") {
    properties.textAnchor = "top-left";
    properties.textOffset = [horizontalOffset / 2, verticalOffset / 2];
    properties.textJustify = "left";
    if (geojsonProperties.type === "event") {
      properties.textField = "\u2196 {label}";
    }
  }

  if (geojsonProperties.type === "pointLightLabel") {
    properties.textSize = 12;
  } else if (geojsonProperties.type === "pointOnly") {
    properties.textField = "";
  } else if (geojsonProperties.type === "label") {
    properties.iconImage = "";
    properties.textAnchor = "center";
    properties.textOffset = [0, 0];
    properties.textJustify = "center";
    properties.textFont = ["GT America Standard Light"];
  } else if (geojsonProperties.type === "epicenter") {
    properties.iconImage = "star-11";
    properties.textField = "";
    properties.iconSize = 2;
  }

  return properties;
}

async function getStyleWithGeoJSONOverlays(style, features, toolBaseUrl, qId) {
  const defaultGeojsonStyles = getDefaultGeojsonStyles();
  const hash = await getHash(features);
  const sourceName = "overlays";
  style.sources[sourceName] = {
    type: "vector",
    tiles: [
      `${toolBaseUrl}/tilesets/${qId}/${hash}/{z}/{x}/{y}.pbf?appendItemToPayload=${qId}`
    ],
    minzoom: 0,
    maxzoom: 14
  };

  const allSymbolIndices = style.layers.reduce((ascending, layer, index) => {
    if (layer.type === "symbol") {
      ascending.push(index);
    }
    return ascending;
  }, []);
  const index = allSymbolIndices[1] || style.layers.length - 1;
  for (const [i, geojson] of features.polygons.entries()) {
    style.layers.splice(index, 0, {
      id: `polygon-${i}`,
      type: "fill",
      source: sourceName,
      "source-layer": `polygon-${i}`,
      paint: {
        "fill-color": [
          "string",
          ["get", "fill"],
          defaultGeojsonStyles.polygon.fill
        ],
        "fill-opacity": [
          "number",
          ["get", "fill-opacity"],
          defaultGeojsonStyles.polygon["fill-opacity"]
        ]
      }
    });

    style.layers.splice(index, 0, {
      id: `polygon-outline-${i}`,
      type: "line",
      source: sourceName,
      "source-layer": `polygon-${i}`,
      paint: {
        "line-color": [
          "string",
          ["get", "stroke"],
          defaultGeojsonStyles.line["stroke"]
        ],
        "line-width": [
          "number",
          ["get", "stroke-width"],
          defaultGeojsonStyles.polygon["stroke-width"]
        ],
        "line-opacity": [
          "number",
          ["get", "stroke-opacity"],
          defaultGeojsonStyles.line["stroke-opacity"]
        ]
      }
    });
  }

  for (const [i, geojson] of features.linestrings.entries()) {
    style.layers.splice(index, 0, {
      id: `linestring-${i}`,
      type: "line",
      source: sourceName,
      "source-layer": `linestring-${i}`,
      paint: {
        "line-color": [
          "string",
          ["get", "stroke"],
          defaultGeojsonStyles.line["stroke"]
        ],
        "line-width": [
          "number",
          ["get", "stroke-width"],
          defaultGeojsonStyles.line["stroke-width"]
        ],
        "line-opacity": [
          "number",
          ["get", "stroke-opacity"],
          defaultGeojsonStyles.line["stroke-opacity"]
        ]
      },
      layout: {
        "line-cap": "round",
        "line-join": "round"
      }
    });
  }

  for (const [i, geojson] of features.points.entries()) {
    const properties = getPointStyleProperties(geojson.properties);
    style.layers.splice(allSymbolIndices.pop(), 0, {
      id: `point-${i}`,
      type: "symbol",
      source: sourceName,
      "source-layer": `point-${i}`,
      layout: {
        "text-field": properties.textField,
        "text-size": properties.textSize,
        "text-font": properties.textFont,
        "text-anchor": properties.textAnchor,
        "text-justify": properties.textJustify,
        "text-offset": properties.textOffset,
        "icon-image": properties.iconImage,
        "icon-size": properties.iconSize
      },
      paint: {
        "text-color": properties.textColor,
        "text-halo-color": properties.textHaloColor,
        "text-halo-width": properties.textHaloWidth
      }
    });
  }

  return style;
}

function getStyleWithHighlightedRegion(style, item, toolBaseUrl) {
  const highlightRegions = Array.from(
    new Set(item.options.highlightRegion.map(region => region.region))
  );
  for (let highlightRegion of highlightRegions) {
    style.sources[`geodata-${highlightRegion}`] = {
      type: "vector",
      tiles: [`${toolBaseUrl}/geodata/${highlightRegion}/{z}/{x}/{y}.pbf`],
      minzoom: 0,
      maxzoom: 18
    };

    let index = 1;
    if (item.options.baseLayer.style === "satellite") {
      index = style.layers.length;
    }

    style.layers.splice(index, 0, {
      id: `highlightedRegion-${highlightRegion}`,
      type: "fill",
      source: `geodata-${highlightRegion}`,
      "source-layer": `geodata-${highlightRegion}`,
      paint: {
        "fill-color": "#fad250",
        "fill-opacity": 1
      }
    });
  }

  return style;
}

async function getStyle(id, item, toolBaseUrl, qId, features) {
  let style = getStyleJSON(id, toolBaseUrl);

  if (item) {
    style = getStyleFilteredByLayer(style, item);
    style = await getStyleWithGeoJSONOverlays(
      style,
      features,
      toolBaseUrl,
      qId
    );
    if (
      item.options.highlightRegion &&
      item.options.highlightRegion.length > 0
    ) {
      style = getStyleWithHighlightedRegion(style, item, toolBaseUrl);
    }
  }

  return style;
}

module.exports = {
  getStyle: getStyle,
  getDefaultGeojsonStyles: getDefaultGeojsonStyles
};
