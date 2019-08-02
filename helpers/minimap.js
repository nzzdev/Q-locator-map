const vega = require("vega");
const fetch = require("node-fetch");
const turf = require("@turf/turf");
const minimapRegionVegaSpec = require("../resources/config/minimapRegionVegaSpec.json");
const minimapGlobeVegaSpec = require("../resources/config/minimapGlobeVegaSpec.json");
const pointMark = {
  type: "shape",
  from: { data: "bbox" },
  encode: {
    update: {
      fill: { value: "red" }
    }
  },
  transform: [
    {
      type: "geoshape",
      projection: "projection",
      pointRadius: 2
    }
  ]
};
const bboxMark = {
  type: "shape",
  from: { data: "bbox" },
  encode: {
    update: {
      stroke: { value: "red" },
      strokeWidth: 1
    }
  },
  transform: [
    {
      type: "geoshape",
      projection: "projection"
    }
  ]
};

async function getGlobeVegaSpec(mapConfig, toolRuntimeConfig) {
  const threshold = 100000000000;
  spec = JSON.parse(JSON.stringify(minimapGlobeVegaSpec));
  const geoDataUrl = `${
    toolRuntimeConfig.toolBaseUrl
  }/geodata/Q11081619.geojson`;

  let center;
  let bboxFeature;
  if (mapConfig.bbox) {
    bboxFeature = turf.bboxPolygon(mapConfig.bbox);
    center = turf.getCoord(turf.centroid(turf.bboxPolygon(mapConfig.bbox)));
    if (turf.area(bboxFeature) < threshold) {
      bboxFeature = turf.point(center);
      spec.marks.push(pointMark);
    } else {
      spec.marks.push(bboxMark);
    }
  } else if (mapConfig.bounds) {
    bboxFeature = turf.bboxPolygon(mapConfig.bounds);
    center = turf.getCoord(turf.centroid(bboxFeature));
    if (turf.area(bboxFeature) < threshold) {
      bboxFeature = turf.point(center);
      spec.marks.push(pointMark);
    } else {
      spec.marks.push(bboxMark);
    }
  } else if (mapConfig.center) {
    bboxFeature = turf.point(mapConfig.center);
    center = mapConfig.center;
    spec.marks.push(pointMark);
  }

  const response = await fetch(geoDataUrl);
  if (response.ok) {
    const region = await response.json();

    spec.signals.push({
      name: "rotate0",
      value: center[0] * -1
    });
    spec.signals.push({
      name: "rotate1",
      value: center[1] * -1
    });
    spec.data.push({
      name: "region",
      values: region,
      format: {
        type: "json"
      }
    });
    spec.data.push({
      name: "bbox",
      values: bboxFeature,
      format: {
        type: "json"
      }
    });
  }

  return spec;
}

async function getRegionVegaSpec(
  minimapOptions,
  mapConfig,
  toolRuntimeConfig,
  height
) {
  const threshold = 50000000;
  spec = JSON.parse(JSON.stringify(minimapRegionVegaSpec));
  const geoDataUrl = `${toolRuntimeConfig.toolBaseUrl}/geodata/${
    minimapOptions.region
  }.geojson`;

  let center;
  let bboxFeature;
  if (mapConfig.bbox) {
    bboxFeature = turf.bboxPolygon(mapConfig.bbox);
    center = turf.getCoord(turf.centroid(turf.bboxPolygon(mapConfig.bbox)));
    if (turf.area(bboxFeature) < threshold) {
      bboxFeature = turf.point(center);
      spec.marks.push(pointMark);
    } else {
      spec.marks.push(bboxMark);
    }
  } else if (mapConfig.bounds) {
    bboxFeature = turf.bboxPolygon(mapConfig.bounds);
    center = turf.getCoord(turf.centroid(bboxFeature));
    if (turf.area(bboxFeature) < threshold) {
      bboxFeature = turf.point(center);
      spec.marks.push(pointMark);
    } else {
      spec.marks.push(bboxMark);
    }
  } else if (mapConfig.center) {
    bboxFeature = turf.point(mapConfig.center);
    center = mapConfig.center;
    spec.marks.push(pointMark);
  }

  const response = await fetch(geoDataUrl);
  if (response.ok) {
    const region = await response.json();
    center = turf.getCoord(turf.centroid(region));
    const bbox = turf.bbox(region);
    const distance = turf.distance([bbox[0], bbox[1]], [bbox[2], bbox[3]], {
      units: "radians"
    });
    const scaleFactor = height / distance;

    spec.signals.push({
      name: "scaleFactor",
      value: scaleFactor
    });
    spec.signals.push({
      name: "rotate0",
      value: center[0] * -1
    });
    spec.signals.push({
      name: "rotate1",
      value: center[1] * -1
    });
    spec.data.push({
      name: "region",
      values: region,
      format: {
        type: "json"
      }
    });
    spec.data.push({
      name: "bbox",
      values: bboxFeature,
      format: {
        type: "json"
      }
    });
  }

  return spec;
}

async function getMinimap(minimapOptions, mapConfig, toolRuntimeConfig) {
  let height = 100;
  let width = 100;

  let spec;
  if (minimapOptions.type === "region") {
    height = 150;
    width = 150;
    spec = await getRegionVegaSpec(
      minimapOptions,
      mapConfig,
      toolRuntimeConfig,
      height
    );
  } else {
    spec = await getGlobeVegaSpec(mapConfig, toolRuntimeConfig);
  }
  spec.height = height;
  spec.width = width;
  const view = new vega.View(vega.parse(spec)).renderer("none").initialize();
  view.logLevel(vega.Warn);
  let svg = await view.toSVG();
  return svg;
}

module.exports = {
  getMinimap: getMinimap
};
