const Boom = require("@hapi/boom");
const Joi = require("@hapi/joi");
const turf = require("@turf/turf");
const NodeGeocoder = require("node-geocoder");
const geocoder = NodeGeocoder({
  provider: "opencage",
  apiKey: process.env.OPENCAGE_APIKEY
});
const allowedComponents = ["country", "state", "county"];

async function getRegionSuggestions(request, point) {
  const enums = [];
  const enum_titles = [];
  const wikidataIds = new Set();

  const coordinates = turf.getCoords(point);

  const response = await geocoder.geocode({
    address: `${coordinates[1]}, ${coordinates[0]}`,
    limit: 1
  });

  if (response.raw.status.code === 200 && response.raw.results.length > 0) {
    const result = response.raw.results.pop();
    const keys = Object.keys(result.components).filter(key => {
      return allowedComponents.includes(key);
    });

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
          const wikidataId = geocoderResult.annotations.wikidata;
          if (wikidataId) {
            wikidataIds.add(wikidataId);
          }
        }
      }
    }

    for (let wikidataId of wikidataIds.values()) {
      const geodataResponse = await request.server.inject(
        `/geodata/${wikidataId}`
      );
      if (geodataResponse.statusCode === 200) {
        const version = geodataResponse.result.versions.pop();
        enum_titles.push(version.label);
        enums.push(wikidataId);
      }
    }

    return {
      enums: enums,
      enum_titles: enum_titles
    };
  }
}

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
    try {
      const item = request.payload.item;
      if (request.params.optionName === "region") {
        let enums = [];
        let enum_titles = [];

        const centerPoints = item.geojsonList.map(geojson => {
          return turf.center(geojson);
        });

        for (const centerPoint of centerPoints) {
          const regionSuggestions = await getRegionSuggestions(
            request,
            centerPoint
          );
          enums = enums.concat(regionSuggestions.enums);
          enum_titles = enum_titles.concat(regionSuggestions.enum_titles);
        }

        return {
          enum: [...new Set(enums)],
          "Q:options": {
            enum_titles: [...new Set(enum_titles)]
          }
        };
      }
    } catch (error) {
      return Boom.badRequest();
    }
    return Boom.badRequest();
  }
};
