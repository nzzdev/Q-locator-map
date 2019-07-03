const turf = require("@turf/turf");
const hasha = require("hasha");
const mbtiles = require("@mapbox/mbtiles");
const vega = require("vega");
const fetch = require("node-fetch");

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

async function getMinimapMarkup(minimapOptions, mapConfig, toolRuntimeConfig) {
  let spec = {};
  const height = 100;
  const width = 100;
  if (minimapOptions.type === "region") {
    spec = require("../resources/config/minimapRegionVegaSpec.json");
    const geoDataUrl = `${toolRuntimeConfig.toolBaseUrl}/datasets/${
      minimapOptions.region
    }.geojson`;

    const response = await fetch(geoDataUrl);
    if (response.ok) {
      const region = await response.json();
      const center = turf.getCoord(turf.centroid(region));
      const bbox = turf.bbox(region);
      const distance = turf.distance([bbox[0], bbox[1]], [bbox[2], bbox[3]], {
        units: "radians"
      });
      const scale = height / distance / Math.sqrt(2);

      spec.signals.push({
        name: "scale",
        value: scale
      });

      spec.signals.push({
        name: "center",
        value: center
      });

      spec.data.push({
        name: "region",
        values: region,
        format: {
          type: "json",
          property: "features"
        }
      });
    }
  } else {
    spec = require("../resources/config/minimapGlobeVegaSpec.json");
    let bboxPolygon;
    if (mapConfig.bounds) {
      bbox = turf.bboxPolygon(mapConfig.bounds);
    } else {
      bbox = turf.point(mapConfig.center);
    }
    spec.signals.push({
      name: "rotate0",
      value: mapConfig.center[1]
    });
    spec.signals.push({
      name: "rotate1",
      value: -5
    });
    spec.data.push({
      name: "bbox",
      values: bbox,
      format: {
        type: "json"
      }
    });
  }
  spec.height = height;
  spec.width = width;
  const view = new vega.View(vega.parse(spec)).renderer("none").initialize();
  view.logLevel(vega.Warn);
  let svg = await view.toSVG();
  // Escape quotation marks (" with \") and forward slashes (</svg> with <\/svg) for serialization of markup in JSON
  svg = svg.replace(/"/g, '\\"');
  svg = svg.replace(/\//g, "\\/");
  return svg;
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

  if (item.options.minimap) {
    const minimapOptions = item.options.minimapOptions || {};
    mapConfig.minimapMarkup = await getMinimapMarkup(
      minimapOptions,
      mapConfig,
      toolRuntimeConfig
    );
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

async function getTile(z, x, y) {
  return await new Promise((resolve, reject) => {
    this.getTile(z, x, y, (err, tile) => {
      if (err) {
        reject(new Error());
      } else {
        resolve(tile);
      }
    });
  });
}

module.exports = {
  getMapConfig: getMapConfig,
  getExactPixelWidth: getExactPixelWidth,
  getHash: getHash,
  getMbtiles: getMbtiles,
  getTile: getTile
};
