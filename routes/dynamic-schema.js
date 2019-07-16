const Boom = require("@hapi/boom");
const Joi = require("@hapi/joi");
const turf = require("@turf/turf");
const NodeGeocoder = require("node-geocoder");
const geocoder = NodeGeocoder({
  provider: "opencage",
  apiKey: process.env.OPENCAGE_APIKEY
});
const allowedComponents = ["country", "state", "county"];

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

        const response = await geocoder.geocode({
          address: `${coordinates[1]}, ${coordinates[0]}`,
          limit: 1
        });

        if (
          response.raw.status.code === 200 &&
          response.raw.results.length > 0
        ) {
          const result = response.raw.results.pop();
          const keys = Object.keys(result.components).filter(key => {
            return allowedComponents.includes(key);
          });
          const enums = [];
          const enum_titles = [];
          for (let key of keys) {
            const geocoderResponse = await geocoder.geocode({
              address: result.components[key],
              countryCode: result.components["country_code"]
            });
            if (
              geocoderResponse.raw.status.code === 200 &&
              geocoderResponse.raw.results.length > 0
            ) {
              for (let geocoderResult of geocoderResponse.raw.results) {
                const id = geocoderResult.annotations.wikidata;
                const geodataResponse = await request.server.inject(
                  `/geodata/${id}`
                );
                if (geodataResponse.statusCode === 200) {
                  const version = geodataResponse.result.versions.pop();
                  if (!enums.includes(id)) {
                    enum_titles.push(version.label);
                    enums.push(id);
                  }
                }
              }
            }
          }

          return {
            enum: enums,
            "Q:options": {
              enum_titles: enum_titles
            }
          };
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
