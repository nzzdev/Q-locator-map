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
        } catch (err) {
          return Boom.notFound();
        }
      }
    });
  }
};
