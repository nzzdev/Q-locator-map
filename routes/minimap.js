const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");
const minimapHelpers = require("../helpers/minimap.js");
const helpers = require("../helpers/helpers.js");

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
        colors: Joi.object().required(),
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
        colors: request.query.colors,
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
        .header("cache-control", helpers.getMaxCache());
    } catch (error) {
      return Boom.notFound();
    }
  }
};
