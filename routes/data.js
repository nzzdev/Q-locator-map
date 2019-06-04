const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");
const mbtiles = util.promisify(require("@mapbox/mbtiles"));
const vtpbf = require("vt-pbf");
const geojsonvt = require("geojson-vt");
const zlib = require("zlib");
const geojsonPrecition = require("geojson-precision");
const geojsonPick = require("geojson-pick");
const fetch = require("node-fetch");

const PRECISION = 4;
const PROPERTY_WHITELIST = [
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
    PROPERTY_WHITELIST
  );
  const trimmedGeojson = geojsonPrecition.parse(reducedGeojson, PRECISION);
  return trimmedGeojson;
}

module.exports = [
  {
    method: "POST",
    path: "/datasets/{hash}/{id}.geojson",
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
          const geojson = getCleanGeojson(item.geojsonList[id]);
          return h
            .response(geojson)
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
  },
  {
    method: "POST",
    path: "/tiles/{hash}/{id}/{z}/{x}/{y}.pbf",
    options: {
      description: "Returns the tiles in pbf format",
      tags: ["api"],
      validate: {
        params: {
          hash: Joi.string().required(),
          id: Joi.string().required(),
          z: Joi.number().required(),
          x: Joi.number().required(),
          y: Joi.number().required()
        },
        query: {
          style: Joi.string().required()
        },
        options: {
          allowUnknown: true
        }
      },
      handler: async (request, h) => {
        try {
          const item = request.payload.item;
          const id = request.params.id;
          const z = request.params.z;
          const x = request.params.x;
          const y = request.params.y;
          const style = request.query.style;
          const accessToken = JSON.parse(process.env.MAP_CONFIG)["nzz_ch"]
            .accessToken;
          const tileUrl = `https://api.mapbox.com/v4/${id}/${z}/${x}/${y}.vector.pbf?style=${style}&access_token=${accessToken}`;
          const response = await fetch(tileUrl);
          if (response) {
            return response.body;
          } else {
            return Boom.notFound();
          }
          // const mbtilesItem = await mbtiles("./data/world.mbtiles?mode=ro");
          // const getTile = util.promisify(mbtilesItem.getTile);
          // return await getTile(z, x, y);
        } catch (err) {
          return Boom.notFound();
        }
      }
    }
  }
];
