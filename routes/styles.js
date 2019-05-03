const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");
const path = require("path");
const fetch = require("node-fetch");
const helpers = require(path.join(__dirname, "/../helpers/helpers.js"));
const mapConfig = JSON.parse(process.env.MAP_CONFIG);

async function getDataUrl(id, item, toolRuntimeConfig, type, qId) {
  const hash = await helpers.getHash(item, toolRuntimeConfig);
  if (type === "geojson") {
    return `${
      toolRuntimeConfig.toolBaseUrl
    }/datasets/${hash}/${id}.${type}?appendItemToPayload=${qId}`;
  } else if (type === "vector") {
    return `${
      toolRuntimeConfig.toolBaseUrl
    }/tilesets/${hash}/${id}/{z}/{x}/{y}.pbf?appendItemToPayload=${qId}`;
  }
}

async function getBaselayerStyle(id) {
  const accessToken = mapConfig.nzz_ch.accessToken;
  const style = Object.entries(mapConfig.nzz_ch.styles).filter(
    entry => entry[0] === id
  )[0][1];
  const response = await fetch(
    `https://api.mapbox.com/styles/v1/${
      style.styleId
    }?access_token=${accessToken}&optimize=true`
  );
  if (response) {
    return await response.json();
  }
}

async function getStyle(id, item, toolRuntimeConfig, qId) {
  const style = await getBaselayerStyle(id);
  if (style) {
    for (const [i, geojson] of item.geojsonList.entries()) {
      const type = "vector";
      const dataUrl = await getDataUrl(i, item, toolRuntimeConfig, type, qId);

      if (type === "geojson") {
        style.sources[`source-${i}`] = {
          type: type,
          data: dataUrl
        };
      } else if (type === "vector") {
        style.sources[`source-${i}`] = {
          type: type,
          tiles: [dataUrl],
          minzoom: 0,
          maxzoom: 18
        };
      }

      style.layers.push({
        id: `label-${i}`,
        type: "symbol",
        source: `source-${i}`,
        "source-layer": `source-${i}`,
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

      const firstSymbolLayerIndex = style.layers.findIndex(
        layer => layer.type === "symbol"
      );

      style.layers.splice(firstSymbolLayerIndex, 0, {
        id: `polygon-${i}`,
        type: "fill",
        source: `source-${i}`,
        "source-layer": `source-${i}`,
        paint: {
          "fill-color": ["string", ["get", "fill"], "#c31906"],
          "fill-opacity": ["number", ["get", "fill-opacity"], 0.35]
        },
        filter: ["==", "$type", "Polygon"]
      });

      style.layers.splice(firstSymbolLayerIndex, 0, {
        id: `polygon-outline-${i}`,
        type: "line",
        source: `source-${i}`,
        "source-layer": `source-${i}`,
        paint: {
          "line-color": ["string", ["get", "stroke"], "#c31906"],
          "line-width": ["number", ["get", "stroke-width"], 0],
          "line-opacity": ["number", ["get", "stroke-opacity"], 1]
        },
        filter: ["==", "$type", "Polygon"]
      });

      style.layers.splice(firstSymbolLayerIndex, 0, {
        id: `linestring-${i}`,
        type: "line",
        source: `source-${i}`,
        "source-layer": `source-${i}`,
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

      style.layers.splice(firstSymbolLayerIndex, 0, {
        id: `point-${i}`,
        type: "circle",
        source: `source-${i}`,
        "source-layer": `source-${i}`,
        paint: {
          "circle-radius": 5,
          "circle-color": "#000000",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff"
        },
        filter: ["==", "$type", "Point"]
      });
    }
  }
  return style;
}

module.exports = [
  {
    method: "POST",
    path: "/styles/{hash}/{id}",
    options: {
      description: "Returns a map style",
      tags: ["api"],
      validate: {
        params: {
          hash: Joi.string().required(),
          id: Joi.string().required()
        },
        query: {
          toolRuntimeConfig: Joi.object().required(),
          qId: Joi.string().required()
        },
        options: {
          allowUnknown: true
        }
      },
      handler: async (request, h) => {
        const id = request.params.id;
        const item = request.payload.item;
        const toolRuntimeConfig = request.query.toolRuntimeConfig;
        const qId = request.query.qId;

        const style = await getStyle(id, item, toolRuntimeConfig, qId);
        if (style) {
          return h
            .response(style)
            .type("application/json")
            .header(
              "cache-control",
              "max-age=31536000, s-maxage=31536000, stale-while-revalidate=31536000, stale-if-error=31536000, immutable"
            );
        } else {
          return Boom.notFound();
        }
      }
    }
  }
];
