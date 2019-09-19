const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");
const minimapHelpers = require("../helpers/minimap.js");

module.exports = {
  method: "GET",
  path: "/minimap/{type}",
  options: {
    description: "Returns the minimap",
    tags: ["api"],
    validate: {
      params: {
        type: Joi.string().required()
      },
      query: {
        bounds: Joi.array()
          .length(4)
          .items(Joi.number()),
        toolBaseUrl: Joi.string().required(),
        regionId: Joi.string().optional(),
        regionLabel: Joi.string().optional()
      }
    }
  },
  handler: async function(request, h) {
    try {
      const options = {
        type: request.params.type,
        bounds: request.query.bounds,
        toolBaseUrl: request.query.toolBaseUrl,
        region: {}
      };

      if (options.type === "region") {
        options.region.id = request.query.regionId;
        options.region.label = request.query.regionLabel;
      }

      const markup = await minimapHelpers.getMinimap(options);

      return h
        .response({
          markup: markup
        })
        .type("application/json")
        .header(
          "cache-control",
          "max-age=31536000, s-maxage=31536000, stale-while-revalidate=31536000, stale-if-error=31536000, immutable"
        );
    } catch (error) {
      return Boom.notFound();
    }
  }
};
