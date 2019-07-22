const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");
const vtpbf = require("vt-pbf");
const geojsonvt = require("geojson-vt");
const zlib = require("zlib");
const geojsonPrecition = require("geojson-precision");
const geojsonPick = require("geojson-pick");
const querystring = require("querystring");

const PRECISION = 4;
const ALLOWED_PROPERTIES = [
  "type",
  "useForInitialView",
  "label",
  "labelPosition",
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-width",
  "stroke-opacity"
];

function getCleanGeojson(geojson) {
  const reducedGeojson = geojsonPick.pickProperties(
    geojson,
    ALLOWED_PROPERTIES
  );
  const trimmedGeojson = geojsonPrecition.parse(reducedGeojson, PRECISION);
  return trimmedGeojson;
}

module.exports = [
  {
    method: "POST",
    path: "/tilesets/{id}/{z}/{x}/{y}.pbf",
    options: {
      description: "Returns the tileset in pbf format",
      tags: ["api"],
      validate: {
        params: {
          id: Joi.number().required(),
          z: Joi.number().required(),
          x: Joi.number().required(),
          y: Joi.number().required()
        },
        options: {
          allowUnknown: true
        }
      },
      handler: (request, h) => {
        const item = request.payload.item;
        const id = request.params.id;
        const z = request.params.z;
        const x = request.params.x;
        const y = request.params.y;

        if (id >= 0 && id < item.geojsonList.length) {
          const geojson = getCleanGeojson(item.geojsonList[id]);
          const tileIndex = geojsonvt(geojson);
          const tile = tileIndex.getTile(z, x, y);
          if (tile) {
            const tileObject = {};
            tileObject[`source-${id}`] = tile;
            const protobuf = zlib.gzipSync(
              vtpbf.fromGeojsonVt(tileObject, { version: 2 })
            );
            return h
              .response(protobuf)
              .type("application/x-protobuf")
              .header("Content-Encoding", "gzip");
          } else {
            return Boom.notFound();
          }
        } else {
          return Boom.notFound();
        }
      }
    }
  },
  {
    method: "GET",
    path: "/datasets/{id}.geojson",
    options: {
      description: "Returns the dataset in geojson format",
      tags: ["api"],
      validate: {
        params: {
          id: Joi.string().required()
        },
        query: {
          version: Joi.number().optional()
        },
        options: {
          allowUnknown: true
        }
      },
      handler: async (request, h) => {
        const id = request.params.id;
        let url = `/geodata/${id}.geojson`;
        if (request.query.version) {
          const query = querystring.stringify({
            version: request.query.version
          });
          url = `${url}?${query}`;
        }
        const response = await request.server.inject(url);
        if (response.statusCode === 200) {
          return h.response(response.result).type("application/geo+json");
        } else {
          return Boom.notFound();
        }
      }
    }
  }
];
