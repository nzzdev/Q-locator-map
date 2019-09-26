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

function getStyleWithHighlightedRegion(style, item, toolBaseUrl) {
  const highlightRegions = Array.from(
    new Set(item.options.highlightRegion.map(region => region.id))
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
        "fill-opacity": 0.4
      }
    });
  }

  return style;
}

async function getStyle(id, item, toolBaseUrl, qId, features) {
  let style = getStyleJSON(id, toolBaseUrl);

  if (item) {
    style = getStyleFilteredByLayer(style, item);
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
