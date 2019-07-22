const db = require("./db.js");
const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");
const fetch = require("node-fetch");
const vtpbf = require("vt-pbf");
const geojsonvt = require("geojson-vt");
const zlib = require("zlib");

function getValidGeodataUrl(geodataEntry, version) {
  if (Number.isInteger(version) && geodataEntry.versions[version]) {
    return geodataEntry.versions[version].format.geojson;
  } else {
    const entry = geodataEntry.versions.pop();
    return entry.format.geojson;
  }
}

module.exports = {
  name: "geodata",
  register: async function(server, options) {
    server.route({
      path: "/geodata/{id}",
      method: "GET",
      options: {
        tags: ["api"],
        validate: {
          params: {
            id: Joi.string().required()
          }
        }
      },
      handler: async function(request, h) {
        try {
          const id = request.params.id;
          const response = await db.get(id);
          if (response.docs.length >= 1) {
            return response.docs.pop();
          } else {
            throw Error("Not Found");
          }
        } catch (error) {
          return Boom.notFound();
        }
      }
    });
    server.route({
      path: "/geodata/{id}",
      method: "POST",
      options: {
        tags: ["api"],
        validate: {
          params: {
            id: Joi.string().required()
          },
          query: {
            version: Joi.number().optional()
          }
        }
      },
      handler: async function(request, h) {
        try {
          const id = request.params.id;
          const version = request.query.version - 1;
          const versionMetadata = request.payload;

          const response = await db.get(id);
          if (response.docs.length === 0) {
            const doc = {
              id: id,
              versions: [versionMetadata]
            };
            return await db.insert(doc);
          } else {
            const doc = response.docs.pop();
            if (Number.isInteger(version) && doc.versions[version]) {
              doc.versions[version] = versionMetadata;
            } else {
              doc.versions.push(versionMetadata);
            }
            return await db.insert(doc);
          }
        } catch (error) {
          return Boom.notFound();
        }
      }
    });
    server.route({
      path: "/geodata/{id}",
      method: "DELETE",
      options: {
        tags: ["api"],
        validate: {
          params: {
            id: Joi.string().required()
          }
        }
      },
      handler: async function(request, h) {
        try {
          const id = request.params.id;
          return await db.remove(id);
        } catch (error) {
          return Boom.notFound();
        }
      }
    });
    server.route({
      path: "/geodata/{id}.geojson",
      method: "GET",
      options: {
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
        }
      },
      handler: async function(request, h) {
        try {
          const version = request.query.version - 1;
          const response = await db.get(request.params.id);
          const geodataEntry = response.docs.pop();
          if (geodataEntry) {
            const geodataUrl = getValidGeodataUrl(geodataEntry, version);
            const response = await fetch(geodataUrl);
            if (response.ok) {
              const geodata = await response.json();
              return h.response(geodata).type("application/geo+json");
            }
          } else {
            throw new Error();
          }
        } catch (error) {
          return Boom.notFound();
        }
      }
    });
    server.route({
      path: "/geodata/{id}/{z}/{x}/{y}.pbf",
      method: "GET",
      options: {
        tags: ["api"],
        validate: {
          params: {
            id: Joi.string().required(),
            z: Joi.number().required(),
            x: Joi.number().required(),
            y: Joi.number().required()
          },
          query: {
            version: Joi.number().optional()
          },
          options: {
            allowUnknown: true
          }
        }
      },
      handler: async function(request, h) {
        try {
          const id = request.params.id;
          const z = request.params.z;
          const x = request.params.x;
          const y = request.params.y;

          const geodataResponse = await request.server.inject(
            `/geodata/${id}.geojson`
          );
          if (geodataResponse.statusCode === 200) {
            const tileIndex = geojsonvt(geodataResponse.result);
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
            }
          }
        } catch (error) {
          return Boom.notFound();
        }
      }
    });
  }
};
