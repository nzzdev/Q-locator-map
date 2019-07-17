const db = require("./db.js");
const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");
const fetch = require("node-fetch");

function getValidGeodataUrl(geodataEntry, version) {
  if (Number.isInteger(version) && geodataEntry.versions[version]) {
    return entry.format.geojson;
  } else {
    const entry = geodataEntry.versions.pop();
    return entry.format.geojson;
  }
}

module.exports = {
  name: "geodata",
  register: async function(server, options) {
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
              return await response.json();
            }
          } else {
            throw Error();
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
  }
};
