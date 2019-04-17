const turf = require("@turf/turf");
const fetch = require("node-fetch");

async function getMapConfig(item, styleConfig) {
  const mapConfig = {};
  mapConfig.accessToken = styleConfig.nzz_ch.accessToken;
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

  const style = Object.entries(styleConfig.nzz_ch.styles).filter(
    entry => entry[0] === item.options.baseLayer
  )[0][1];
  mapConfig.style = await getStyle(style, styleConfig.nzz_ch.accessToken);
  const firstSymbolLayerIndex = mapConfig.style.layers.findIndex(
    layer => layer.type === "symbol"
  );
  for (const [i, geojson] of item.geojsonList.entries()) {
    mapConfig.style.sources[`source-${i}`] = {
      type: "geojson",
      data: geojson
    };

    mapConfig.style.layers.splice(firstSymbolLayerIndex, 0, {
      id: `polygon-${i}`,
      type: "fill",
      source: `source-${i}`,
      paint: {
        "fill-color": ["string", ["get", "fill"], "#c31906"],
        "fill-opacity": ["number", ["get", "fill-opacity"], 0.35]
      },
      filter: ["==", "$type", "Polygon"]
    });

    mapConfig.style.layers.splice(firstSymbolLayerIndex, 0, {
      id: `polygon-outline-${i}`,
      type: "line",
      source: `source-${i}`,
      paint: {
        "line-color": ["string", ["get", "stroke"], "#c31906"],
        "line-width": ["number", ["get", "stroke-width"], 0],
        "line-opacity": ["number", ["get", "stroke-opacity"], 1]
      },
      filter: ["==", "$type", "Polygon"]
    });

    mapConfig.style.layers.push({
      id: `linestring-${i}`,
      type: "line",
      source: `source-${i}`,
      paint: {
        "line-color": ["string", ["get", "stroke"], "#c31906"],
        "line-width": ["number", ["get", "stroke-width"], 2],
        "line-opacity": ["number", ["get", "stroke-opacity"], 1]
      },
      layout: {
        "line-cap": "round",
        "line-join": "round"
      },
      filter: ["==", "$type", "LineString"]
    });

    mapConfig.style.layers.push({
      id: `point-${i}`,
      type: "circle",
      source: `source-${i}`,
      paint: {
        "circle-radius": 5,
        "circle-color": "#000000",
        "circle-stroke-width": 2,
        "circle-stroke-color": "#ffffff"
      },
      filter: ["==", "$type", "Point"]
    });

    mapConfig.style.layers.push({
      id: `label-${i}`,
      type: "symbol",
      source: `source-${i}`,
      layout: {
        "text-field": "{label}",
        "text-size": 13,
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-line-height": 1.1,
        "text-offset": [0, -2],
        "text-anchor": ["string", ["get", "labelPosition"], "center"]
      },
      paint: {
        "text-halo-color": "#ffffff",
        "text-halo-width": 4,
        "text-halo-blur": 4
      },
      filter: ["==", "$type", "Point"]
    });
  }
  return mapConfig;
}

async function getStyle(config, access_token) {
  const response = await fetch(
    `https://api.mapbox.com/styles/v1/${
      config.styleId
    }?access_token=${access_token}`
  );
  if (response) {
    const style = await response.json();
    return style;
  }
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
