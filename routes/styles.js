const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");
const resourcesDir = "../resources/";
const basicStyle = require(`${resourcesDir}styles/basic/style.json`);
const topoStyle = require(`${resourcesDir}styles/topo/style.json`);
const satelliteStyle = require(`${resourcesDir}styles/satellite/style.json`);
const defaultGeojsonStyles = require("../helpers/helpers.js").getDefaultGeojsonStyles();

async function getStyle(id, item, toolBaseUrl, qId) {
  let style;
  if (["terrain", "terrainNoLabels"].includes(id)) {
    style = JSON.stringify(topoStyle);
  } else if (id === "aerial") {
    style = JSON.stringify(satelliteStyle);
  } else {
    style = JSON.stringify(basicStyle);
  }
  style = JSON.parse(
    style
      .replace(/\${maptiler_access_token}/g, process.env.MAPTILER_ACCESS_TOKEN)
      .replace(/\${mapbox_access_token}/g, process.env.MAPBOX_ACCESS_TOKEN)
      .replace(/\${toolBaseUrl}/g, toolBaseUrl)
  );

  if (style) {
    if (item) {
      let = firstSymbolLayerIndex = style.layers.findIndex(
        layer => layer.type === "symbol"
      );
      for (const [i, geojson] of item.geojsonList.entries()) {
        style.sources[`source-${i}`] = {
          type: "vector",
          tiles: [
            `${toolBaseUrl}/tilesets/${i}/{z}/{x}/{y}.pbf?appendItemToPayload=${qId}`
          ],
          minzoom: 0,
          maxzoom: 18
        };

        style.layers.push({
          id: `label-${i}`,
          type: "symbol",
          source: `source-${i}`,
          "source-layer": `source-${i}`,
          layout: {
            "text-field": "{label}",
            "text-size": 13,
            "text-font": ["Noto Sans Bold"],
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

        firstSymbolLayerIndex = style.layers.findIndex(
          layer => layer.type === "symbol"
        );

        style.layers.splice(firstSymbolLayerIndex, 0, {
          id: `polygon-${i}`,
          type: "fill",
          source: `source-${i}`,
          "source-layer": `source-${i}`,
          paint: {
            "fill-color": ["string", ["get", "fill"], defaultGeojsonStyles.polygon.fill],
            "fill-opacity": ["number", ["get", "fill-opacity"], defaultGeojsonStyles.polygon["fill-opacity"]]
          },
          filter: ["==", "$type", "Polygon"]
        });

        style.layers.splice(firstSymbolLayerIndex, 0, {
          id: `polygon-outline-${i}`,
          type: "line",
          source: `source-${i}`,
          "source-layer": `source-${i}`,
          paint: {
            "line-color": ["string", ["get", "stroke"], defaultGeojsonStyles.line["stroke"]],
            "line-width": ["number", ["get", "stroke-width"], defaultGeojsonStyles.polygon["stroke-width"]],
            "line-opacity": ["number", ["get", "stroke-opacity"], defaultGeojsonStyles.line["stroke-opacity"]]
          },
          filter: ["==", "$type", "Polygon"]
        });

        style.layers.splice(firstSymbolLayerIndex, 0, {
          id: `linestring-${i}`,
          type: "line",
          source: `source-${i}`,
          "source-layer": `source-${i}`,
          paint: {
            "line-color": ["string", ["get", "stroke"], defaultGeojsonStyles.line["stroke"]],
            "line-width": ["number", ["get", "stroke-width"], defaultGeojsonStyles.line["stroke-width"]],
            "line-opacity": ["number", ["get", "stroke-opacity"], defaultGeojsonStyles.line["stroke-opacity"]]
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

      if (
        item.options.highlightRegion &&
        item.options.highlightRegion.length > 0
      ) {
        for (let highlightRegion of item.options.highlightRegion) {
          style.sources[`source-${highlightRegion.region}`] = {
            type: "vector",
            tiles: [
              `${toolBaseUrl}/geodata/${highlightRegion.region}/{z}/{x}/{y}.pbf`
            ],
            minzoom: 0,
            maxzoom: 18
          };

          style.layers.splice(firstSymbolLayerIndex, 0, {
            id: `highlightedRegion-${highlightRegion.region}`,
            type: "fill",
            source: `source-${highlightRegion.region}`,
            "source-layer": `source-${highlightRegion.region}`,
            paint: {
              "fill-color": "#ffffff",
              "fill-opacity": 0.5
            }
          });
        }
      }
    }
  }
  return style;
}

module.exports = [
  {
    method: "GET",
    path: "/styles/{id}",
    options: {
      description: "Returns a map style",
      tags: ["api"],
      validate: {
        params: {
          id: Joi.string().required()
        },
        query: {
          toolBaseUrl: Joi.string().required()
        }
      },
      handler: async (request, h) => {
        const id = request.params.id;
        const toolBaseUrl = request.query.toolBaseUrl;
        let item;
        let qId;

        const style = await getStyle(id, item, toolBaseUrl, qId);
        if (style) {
          return style;
        } else {
          return Boom.notFound();
        }
      }
    }
  },
  {
    method: "POST",
    path: "/styles/{id}",
    options: {
      description: "Returns a map style",
      tags: ["api"],
      validate: {
        params: {
          id: Joi.string().required()
        },
        query: {
          toolBaseUrl: Joi.string().required(),
          qId: Joi.string().required()
        },
        options: {
          allowUnknown: true
        }
      },
      handler: async (request, h) => {
        const id = request.params.id;
        const item = request.payload.item;
        const toolBaseUrl = request.query.toolBaseUrl;
        const qId = request.query.qId;

        const style = await getStyle(id, item, toolBaseUrl, qId);
        if (style) {
          return style;
        } else {
          return Boom.notFound();
        }
      }
    }
  }
];
