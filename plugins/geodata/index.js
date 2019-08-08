const db = require("./db.js");
const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");

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
            version: Joi.number()
              .optional()
              .default(-1)
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
            if (version >= 0 && doc.versions[version]) {
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
            version: Joi.number()
              .optional()
              .default(-1)
          },
          options: {
            allowUnknown: true
          }
        }
      },
      handler: async function(request, h) {
        try {
          const id = request.params.id;
          const version = request.query.version - 1;
          const geodata = await request.server.methods.getGeodataGeojson(
            id,
            version
          );
          return h.response(geodata).type("application/geo+json");
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
            version: Joi.number()
              .optional()
              .default(-1)
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
          const version = request.query.version;

          const tile = await request.server.methods.getGeodataTile(
            id,
            z,
            x,
            y,
            version
          );

          return h
            .response(tile)
            .type("application/x-protobuf")
            .header("Content-Encoding", "gzip")
            .header(
              "cache-control",
              "max-age=31536000, s-maxage=31536000, stale-while-revalidate=31536000, stale-if-error=31536000, immutable"
            );
        } catch (error) {
          return Boom.notFound();
        }
      }
    });
  }
};
