const vega = require("vega");
const fetch = require("node-fetch");
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
      fill: { signal: "bboxColor" }
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
      stroke: { signal: "bboxColor" },
      strokeWidth: 2
    }
  },
  transform: [
    {
      type: "geoshape",
      projection: "projection"
    }
  ]
};

function getGlobeVegaSpec(options) {
  const spec = JSON.parse(JSON.stringify(minimapGlobeVegaSpec));
  spec.height = options.styleConfig.globe.width;
  spec.width = options.styleConfig.globe.width;
  let bboxFeature = turf.rewind(turf.bboxPolygon(options.bounds), {
    reverse: true
  });
  const center = turf.getCoord(turf.centroid(bboxFeature));
  const areaRatio = turf.area(globeGeojson) / turf.area(bboxFeature);
  if (areaRatio > threshold) {
    bboxFeature = turf.point(center);
    spec.marks.push(pointMark);
  } else {
    spec.marks.push(bboxMark);
  }

  spec.signals.push({
    name: "landColor",
    value: options.styleConfig.landColor
  });
  spec.signals.push({
    name: "landOutlineColor",
    value: options.styleConfig.landOutlineColor
  });
  spec.signals.push({
    name: "waterColor",
    value: options.styleConfig.waterColor
  });
  spec.signals.push({
    name: "bboxColor",
    value: options.styleConfig.bboxColor
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
    values: globeGeojson,
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

  return spec;
}

function getDimensions(spec, bbox, options) {
  const minX = bbox[0];
  const minY = bbox[1];
  const maxX = bbox[2];
  const maxY = bbox[3];

  const distanceX = turf.distance([minX, minY], [maxX, minY], {
    units: "radians"
  });
  const distanceY = turf.distance([maxX, minY], [maxX, maxY], {
    units: "radians"
  });
  let aspectRatio = 1;
  const defaultDimension = options.styleConfig.region.width;
  const minDimension = options.styleConfig.region.minWidth;
  let width;
  let height;
  if (distanceX > distanceY) {
    aspectRatio = distanceY / distanceX;
    width = defaultDimension;
    height = defaultDimension * aspectRatio;
    if (height < minDimension) height = minDimension;
  } else if (distanceX < distanceY) {
    aspectRatio = distanceX / distanceY;
    width = defaultDimension * aspectRatio;
    if (width < minDimension) width = minDimension;
    height = defaultDimension;
  }

  const distance = turf.distance([minX, minY], [maxX, maxY], {
    units: "radians"
  });
  let scaleFactor = height / distance;
  if (width > height) {
    scaleFactor = width / distance;
  }

  let translateX = spec.width - width / 2;
  let translateY = spec.height - height / 2;
  if (spec.width === width) {
    translateX = spec.width / 2;
  }
  if (spec.height === height) {
    translateY = spec.height / 2;
  }

  return {
    translateX: translateX,
    translateY: translateY,
    scaleFactor: scaleFactor
  };
}

async function getRegionVegaSpec(options) {
  const spec = JSON.parse(JSON.stringify(minimapRegionVegaSpec));
  spec.width = options.styleConfig.region.width;
  spec.height = options.styleConfig.region.width;
  const geoDataUrl = `${options.toolBaseUrl}/geodata/${options.region.id}.geojson`;
  let bboxFeature = turf.bboxPolygon(options.bounds);

  const response = await fetch(geoDataUrl);
  if (response.ok) {
    const region = await response.json();
    const center = turf.getCoord(turf.centerOfMass(region));
    const areaRatio = turf.area(region) / turf.area(bboxFeature);
    if (areaRatio > threshold) {
      bboxFeature = turf.centroid(bboxFeature);
      spec.marks.push(pointMark);
    } else {
      spec.marks.push(bboxMark);
    }
    const bbox = turf.bbox(region);
    const dimensions = getDimensions(spec, bbox, options);

    let projection = "azimuthalEqualArea";
    // Use albersUsa projection for usa region (wikidataId: Q30)
    if (options.region.id === "Q30") {
      projection = "albersUsa";
    }
    spec.signals.push({
      name: "projection",
      value: projection
    });
    spec.signals.push({
      name: "landColor",
      value: options.styleConfig.landColor
    });
    spec.signals.push({
      name: "landOutlineColor",
      value: options.styleConfig.landOutlineColor
    });
    spec.signals.push({
      name: "textColor",
      value: options.styleConfig.textColor
    });
    spec.signals.push({
      name: "textFont",
      value: `${options.styleConfig.textFont},nzz-sans-serif,Helvetica,Arial`
    });
    spec.signals.push({
      name: "textSize",
      value: options.styleConfig.textSize
    });
    spec.signals.push({
      name: "bboxColor",
      value: options.styleConfig.bboxColor
    });
    spec.signals.push({
      name: "scaleFactor",
      value: dimensions.scaleFactor
    });
    spec.signals.push({
      name: "translateX",
      value: dimensions.translateX
    });
    spec.signals.push({
      name: "translateY",
      value: dimensions.translateY
    });
    spec.signals.push({
      name: "rotate0",
      value: center[0] * -1
    });
    spec.signals.push({
      name: "rotate1",
      value: center[1] * -1
    });

    let label = region.properties.name_de ? region.properties.name_de : "";
    if (options.region.label && options.region.label !== "") {
      label = options.region.label;
    }
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
  getMinimap: getMinimap
};
