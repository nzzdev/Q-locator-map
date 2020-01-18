const Boom = require("@hapi/boom");
const Joi = require("@hapi/joi");
const turf = require("@turf/turf");

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
          const coordinates = centerPoint.geometry.coordinates;
          const regionSuggestions = await request.server.methods.getRegionSuggestions(
            coordinates[0],
            coordinates[1]
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
