const vega = require("vega");
const fetch = require("node-fetch");
const turf = require("@turf/turf");
const minimapRegionVegaSpec = require("../resources/config/minimapRegionVegaSpec.json");
const minimapGlobeVegaSpec = require("../resources/config/minimapGlobeVegaSpec.json");
const threshold = 500;
const pointMark = {
  type: "shape",
  from: { data: "bbox" },
  encode: {
    update: {
      fill: { value: "#d64113" }
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
      stroke: { value: "#d64113" },
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

async function getGlobeVegaSpec(options) {
  const spec = JSON.parse(JSON.stringify(minimapGlobeVegaSpec));
  const geoDataUrl = `${options.toolBaseUrl}/geodata/${options.region}.geojson`;
  let bboxFeature = turf.rewind(turf.bboxPolygon(options.bounds), {
    reverse: true
  });
  const center = turf.getCoord(turf.centroid(bboxFeature));

  const response = await fetch(geoDataUrl);
  if (response.ok) {
    const region = await response.json();
    const areaRatio = turf.area(region) / turf.area(bboxFeature);
    if (areaRatio > threshold) {
      bboxFeature = turf.point(center);
      spec.marks.push(pointMark);
    } else {
      spec.marks.push(bboxMark);
    }

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

async function getRegionVegaSpec(options, height) {
  const spec = JSON.parse(JSON.stringify(minimapRegionVegaSpec));
  const geoDataUrl = `${options.toolBaseUrl}/geodata/${options.region}.geojson`;
  let bboxFeature = turf.bboxPolygon(options.bounds);

  const response = await fetch(geoDataUrl);
  if (response.ok) {
    const region = await response.json();
    const center = turf.getCoord(turf.centroid(region));
    const areaRatio = turf.area(region) / turf.area(bboxFeature);
    if (areaRatio > threshold) {
      bboxFeature = turf.point(center);
      spec.marks.push(pointMark);
    } else {
      spec.marks.push(bboxMark);
    }
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

    const label = region.properties.name_de ? region.properties.name_de : "";
    spec.signals.push({
      name: "label",
      value: label
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

async function getMinimap(options) {
  let height = 90;
  let width = 90;

  let spec;
  if (options.type === "region") {
    height = 120;
    width = 120;
    spec = await getRegionVegaSpec(options, height);
  } else {
    options.region = "Q11081619";
    spec = await getGlobeVegaSpec(options);
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
