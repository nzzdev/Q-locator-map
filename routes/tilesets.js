const Joi = require("joi");
const Boom = require("boom");
const vtpbf = require("vt-pbf");
const geojsonvt = require("geojson-vt");
const zlib = require("zlib");

module.exports = [
  {
    method: "POST",
    path: "/tilesets/{hash}/{id}.geojson",
    options: {
      description: "Returns the tileset in geojson format",
      tags: ["api"],
      validate: {
        params: {
          hash: Joi.string().required(),
          id: Joi.number().required()
        },
        options: {
          allowUnknown: true
        }
      },
      handler: (request, h) => {
        const item = request.payload.item;
        const id = request.params.id;
        if (id >= 0 && id < item.geojsonList.length) {
          return h
            .response(item.geojsonList[id])
            .type("application/geo+json")
            .header(
              "cache-control",
              "max-age=31536000, s-maxage=31536000, stale-while-revalidate=31536000, stale-if-error=31536000, immutable"
            );
        } else {
          return Boom.notFound();
        }
      }
    }
  },
  {
    method: "POST",
    path: "/tilesets/{hash}/{id}/{z}/{x}/{y}.pbf",
    options: {
      description: "Returns the tileset in pbf format",
      tags: ["api"],
      validate: {
        params: {
          hash: Joi.string().required(),
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
          const tileIndex = geojsonvt(item.geojsonList[id]);
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
              .header("Content-Encoding", "gzip")
              .header(
                "cache-control",
                "max-age=31536000, s-maxage=31536000, stale-while-revalidate=31536000, stale-if-error=31536000, immutable"
              );
          } else {
            return Boom.notFound();
          }
        } else {
          return Boom.notFound();
        }
      }
    }
  }
];
