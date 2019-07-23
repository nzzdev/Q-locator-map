const Boom = require("@hapi/boom");
const Joi = require("@hapi/joi");
const turf = require("@turf/turf");
const allowedComponents = ["country", "state", "county"];

async function getRegionSuggestions(request, point) {
  try {
    const coordinates = turf.getCoords(point);
    const response = await request.server.app.geocoder.geocode({
      address: `${coordinates[1]}, ${coordinates[0]}`,
      limit: 1
    });

    if (response.raw.status.code === 200 && response.raw.results.length > 0) {
      const result = response.raw.results.pop();
      const components = Object.entries(result.components).filter(component => {
        return allowedComponents.includes(component[0]);
      });
      if (components.length > 0) {
        const regionSuggestions = await request.server.methods.getRegionSuggestions(
          components,
          result.components["country_code"]
        );

        return {
          enums: regionSuggestions.enums,
          enum_titles: regionSuggestions.enum_titles
        };
      } else {
        throw new Error();
      }
    } else {
      throw new Error();
    }
  } catch (error) {
    return {
      enums: [],
      enum_titles: []
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
