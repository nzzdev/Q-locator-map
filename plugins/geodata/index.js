const db = require("./db.js");
const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");
const fetch = require("node-fetch");

function getValidGeodataUrl(geodataEntry, version) {
  const versions = geodataEntry.versions.sort((a, b) => a.version - b.version);
  if (version) {
    const entry = versions.find(entry => entry.version === version);
    if (entry) {
      return entry.format.geojson;
    } else {
      const entry = versions.pop();
      return entry.format.geojson;
    }
  } else {
    const entry = versions.pop();
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
          const response = await db.get(request.params.id);
          const geodataEntry = response.docs.pop();
          if (geodataEntry) {
            const geodataUrl = getValidGeodataUrl(
              geodataEntry,
              request.query.version
            );
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
          }
        }
      },
      handler: async function(request, h) {
        try {
          const id = request.params.id;
          const version = request.payload;

          const response = await db.get(id);
          if (response.docs.length === 0) {
            version.version = 1;
            const doc = {
              id: id,
              versions: [version]
            };
            return await db.insert(doc);
          } else {
            const doc = response.docs.pop();
            if (version.version) {
              const index = doc.versions.findIndex(
                entry => entry.version === version.version
              );
              if (index !== -1) {
                doc.versions[index] = version;
              }
            } else {
              version.version = doc.versions.length + 1;
              doc.versions.push(version);
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
