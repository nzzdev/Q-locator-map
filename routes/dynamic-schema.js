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
          enum: enums,
          "Q:options": {
            enum_titles: enum_titles
          }
        };
      } else if (request.params.optionName === "bounds") {
        // calculate a bouding box of all features
        let boundsPolygon = turf.bboxPolygon(
          turf.bbox(
            turf.featureCollection(
              item.geojsonList.map(feature =>
                turf.bboxPolygon(turf.bbox(feature))
              )
            )
          )
        );

        // if the bounds area is smaller than 100000 m2 add a buffer of 10 km
        const area = turf.area(boundsPolygon);
        if (area < 100000) {
          boundsPolygon = turf.buffer(boundsPolygon, 10);
        }

        const bounds = turf.bbox(boundsPolygon);
        return {
          bounds: [
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]]
          ]
        };
      }
    } catch (error) {
      return Boom.badRequest();
    }
    return Boom.badRequest();
  }
};
