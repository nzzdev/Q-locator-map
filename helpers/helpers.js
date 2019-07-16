const turf = require("@turf/turf");
const hasha = require("hasha");
const mbtiles = require("@mapbox/mbtiles");
const vega = require("vega");
const fetch = require("node-fetch");
const Boom = require("@hapi/boom");
const minimapRegionVegaSpec = require("../resources/config/minimapRegionVegaSpec.json");
const minimapGlobeVegaSpec = require("../resources/config/minimapGlobeVegaSpec.json");

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
  if (qId) {
    return `${
      toolRuntimeConfig.toolBaseUrl
    }/styles/${id}?appendItemToPayload=${qId}&qId=${qId}&toolBaseUrl=${
      toolRuntimeConfig.toolBaseUrl
    }`;
  } else {
    return `${toolRuntimeConfig.toolBaseUrl}/styles/${id}?toolBaseUrl=${
      toolRuntimeConfig.toolBaseUrl
    }`;
  }
}

async function getMinimapMarkup(minimapOptions, mapConfig, toolRuntimeConfig) {
  const height = 100;
  const width = 100;
  let spec;
  if (minimapOptions.type === "region") {
    spec = JSON.parse(JSON.stringify(minimapRegionVegaSpec));
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
      const scaleFactor = height / distance / Math.sqrt(2);

      spec.signals.push({
        name: "scaleFactor",
        value: scaleFactor
      });

      spec.signals.push({
        name: "center",
        value: center
      });

      spec.data.push({
        name: "region",
        values: region,
        format: {
          type: "json"
        }
      });
    }
  } else {
    spec = JSON.parse(JSON.stringify(minimapGlobeVegaSpec));
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

  const minimapOptions = item.options.minimapOptions || {};
  if (
    (item.options.minimap && minimapOptions.type === "globe") ||
    (item.options.minimap &&
      minimapOptions.type === "region" &&
      minimapOptions.region)
  ) {
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

function getTileset(path) {
  const tilesetPath = `${path}?mode=ro`;
  return new Promise(function(resolve, reject) {
    new mbtiles(tilesetPath, function(err, tileset) {
      if (err) {
        reject(err);
      } else {
        resolve(tileset);
      }
    });
  });
}

async function getTile(tileset, z, x, y) {
  return await new Promise((resolve, reject) => {
    this.tilesets[tileset].getTile(z, x, y, (error, tile) => {
      if (error) {
        reject(Boom.notFound());
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
  getTileset: getTileset,
  getTile: getTile
};
