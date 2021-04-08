const vega = require("vega");
const turf = require("@turf/turf");
const minimapRegionVegaSpec = require("../resources/config/minimapRegionVegaSpec.json");
const minimapGlobeVegaSpec = require("../resources/config/minimapGlobeVegaSpec.json");
const globeGeojson = require("../resources/config/globe.json");
const threshold = 500;
const pointMark = {
  type: "shape",
  from: { data: "bbox" },
  encode: {
    update: {
      fill: { signal: "bboxColor" },
    },
  },
  transform: [
    {
      type: "geoshape",
      projection: "projection",
      pointRadius: 2,
    },
  ],
};
const bboxMark = {
  type: "shape",
  from: { data: "bbox" },
  encode: {
    update: {
      stroke: { signal: "bboxColor" },
      strokeWidth: 2,
    },
  },
  transform: [
    {
      type: "geoshape",
      projection: "projection",
    },
  ],
};

function getGlobeVegaSpec(options) {
  const spec = JSON.parse(JSON.stringify(minimapGlobeVegaSpec));
  spec.height = options.styleConfig.globe.width;
  spec.width = options.styleConfig.globe.width;
  let bboxFeature = turf.rewind(turf.bboxPolygon(options.bounds), {
    reverse: true,
  });
  const center = turf.getCoord(turf.centroid(bboxFeature));
  const areaRatio = turf.area(globeGeojson) / turf.area(bboxFeature);
  if (areaRatio > threshold) {
    bboxFeature = turf.point(center);
    spec.marks.push(pointMark);
  } else {
    spec.marks.push(bboxMark);
  }

  if (!options.styleConfig.hasShadow) {
    spec.marks.push({
      type: "shape",
      from: { data: "sphere" },
      encode: {
        update: {
          stroke: { signal: "landOutlineColor" },
          strokeWidth: { signal: 0.5 },
        },
      },
      transform: [
        {
          type: "geoshape",
          projection: "projection",
        },
      ],
    });
    spec.padding = 2;
  }

  spec.signals.push({
    name: "landColor",
    value: options.styleConfig.landColor,
  });
  spec.signals.push({
    name: "landOutlineColor",
    value: options.styleConfig.globe.landOutlineColor,
  });
  spec.signals.push({
    name: "landOutlineWidth",
    value: options.styleConfig.globe.landOutlineWidth,
  });
  spec.signals.push({
    name: "waterColor",
    value: options.styleConfig.globe.waterColor,
  });
  spec.signals.push({
    name: "bboxColor",
    value: options.styleConfig.bboxColor,
  });
  spec.signals.push({
    name: "rotate0",
    value: center[0] * -1,
  });
  spec.signals.push({
    name: "rotate1",
    value: center[1] * -1,
  });
  spec.data.push({
    name: "region",
    values: globeGeojson,
    format: {
      type: "json",
    },
  });
  spec.data.push({
    name: "bbox",
    values: bboxFeature,
    format: {
      type: "json",
    },
  });

  return spec;
}

async function getRegionVegaSpec(options) {
  const spec = JSON.parse(JSON.stringify(minimapRegionVegaSpec));
  let bboxFeature = turf.rewind(turf.bboxPolygon(options.bounds), {
    reverse: true,
  });
  const region = await options.getGeodataGeojson(options.region.id);
  const center = turf.getCoord(turf.centerOfMass(region));
  const areaRatio = turf.area(region) / turf.area(bboxFeature);
  if (areaRatio > threshold) {
    bboxFeature = turf.centroid(bboxFeature);
    spec.marks.push(pointMark);
  } else {
    spec.marks.push(bboxMark);
  }
  
  const bbox = turf.bbox(region);
  const defaultDimension = options.styleConfig.region.width;
  const distance = turf.distance([bbox[0], bbox[1]], [bbox[2], bbox[3]], {
    units: "radians",
  });
  const scaleFactor = defaultDimension / distance;

  let projection = "azimuthalEqualArea";
  // Use albersUsa projection for usa region (wikidataId: Q30)
  if (options.region.id === "Q30") {
    projection = "albersUsa";
  }
  spec.signals.push({
    name: "projection",
    value: projection,
  });
  spec.signals.push({
    name: "landColor",
    value: options.styleConfig.landColor,
  });
  spec.signals.push({
    name: "landOutlineColor",
    value: options.styleConfig.region.landOutlineColor,
  });
  spec.signals.push({
    name: "landOutlineWidth",
    value: options.styleConfig.region.landOutlineWidth,
  });
  spec.signals.push({
    name: "textColor",
    value: options.styleConfig.textColor,
  });
  spec.signals.push({
    name: "textFont",
    value: `${options.styleConfig.textFont},nzz-sans-serif,Helvetica,Arial`,
  });
  spec.signals.push({
    name: "textSize",
    value: options.styleConfig.textSize,
  });
  spec.signals.push({
    name: "bboxColor",
    value: options.styleConfig.bboxColor,
  });
  spec.signals.push({
    name: "scaleFactor",
    value: scaleFactor,
  });
  spec.signals.push({
    name: "rotate0",
    value: center[0] * -1,
  });
  spec.signals.push({
    name: "rotate1",
    value: center[1] * -1,
  });

  let label = "";
  if (options.region.label && options.region.label !== "") {
    label = options.region.label;
  } else if (region.properties.name_de) {
    label = region.properties.name_de;
  } else if (region.properties.name) {
    label = region.properties.name;
  }

  spec.signals.push({
    name: "label",
    value: label,
  });
  spec.data.push({
    name: "region",
    values: region,
    format: {
      type: "json",
    },
  });
  spec.data.push({
    name: "bbox",
    values: bboxFeature,
    format: {
      type: "json",
    },
  });

  return spec;
}

async function getMinimap(options) {
  let spec;
  if (options.type === "region") {
    spec = await getRegionVegaSpec(options);
  } else {
    spec = getGlobeVegaSpec(options);
  }

  const view = new vega.View(vega.parse(spec)).renderer("none").initialize();
  view.logLevel(vega.Warn);
  let svg = await view.toSVG();
  return svg;
}

module.exports = {
  getMinimap: getMinimap,
};
