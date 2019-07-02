const Boom = require("@hapi/boom");
const Joi = require("@hapi/joi");
const turf = require("@turf/turf");
const NodeGeocoder = require("node-geocoder");
const geocoder = NodeGeocoder({
  provider: "opencage",
  apiKey: process.env.OPENCAGE_APIKEY
});
const componentWhitelist = ["country", "state"];

module.exports = {
  method: "POST",
  path: "/dynamic-schema/{optionName}",
  options: {
    validate: {
      payload: Joi.object()
    },
    cors: true
  },
  handler: async function(request, h) {
    const item = request.payload.item;
    if (request.params.optionName === "region") {
      try {
        const center = turf.center(
          turf.featureCollection(
            item.geojsonList.map(geojson => {
              return turf.center(geojson);
            })
          )
        );
        const coordinates = turf.getCoords(center);

        const response = await geocoder.geocode(
          `${coordinates[1]}, ${coordinates[0]}`
        );

        if (response.raw.status.code === 200) {
          if (response.raw.results.length > 0) {
            const result = response.raw.results.pop();
            const components = Object.entries(result.components).filter(
              ([key, value]) => {
                return componentWhitelist.includes(key);
              }
            );
            const enums = [];
            const enum_titles = [];
            for (let component of components) {
              const name = component[1];
              const response = await geocoder.geocode(name);
              if (response.raw.status.code === 200) {
                const result = response.raw.results[0];
                enum_titles.push(name);
                enums.push(result.annotations.wikidata);
              }
            }

            return {
              enum: enums,
              "Q:options": {
                enum_titles: enum_titles
              }
            };
          }
        } else {
          throw Error();
        }
      } catch (error) {
        return Boom.badRequest();
      }
    }
    return Boom.badRequest();
  }
};
