const Joi = require("joi");
const Boom = require("@hapi/boom");
const minimapHelpers = require("../helpers/minimap.js");
const helpers = require("../helpers/helpers.js");

const Bourne = require("@hapi/bourne");
const customJoi = Joi.extend(
  {
    type: "object",
    base: Joi.object(),
    coerce: {
      from: "string",
      method(value, helpers) {
        if (value[0] !== "{" && !/^\s*\{/.test(value)) {
          return;
        }

        try {
          return { value: Bourne.parse(value) };
        } catch (ignoreErr) {}
      },
    },
  },
  {
    type: "array",
    base: Joi.array(),
    coerce: {
      from: "string",
      method(value) {
        if (
          typeof value !== "string" ||
          (value[0] !== "[" && !/^\s*\[/.test(value))
        ) {
          return;
        }

        try {
          return { value: Bourne.parse(value) };
        } catch (ignoreErr) {}
      },
    },
  }
);

module.exports = {
  method: "GET",
  path: "/minimap/{type}",
  options: {
    description: "Returns the minimap",
    tags: ["api"],
    validate: {
      params: {
        type: Joi.string().required(),
      },
      query: {
        bounds: customJoi.array().length(4).items(Joi.number()),
        styleConfig: customJoi.object().required(),
        toolBaseUrl: Joi.string().required(),
        regionId: Joi.string().optional(),
        regionLabel: Joi.string().optional(),
      },
    },
  },
  handler: async function (request, h) {
    try {
      const options = {
        type: request.params.type,
        bounds: request.query.bounds,
        styleConfig: request.query.styleConfig,
        region: {},
        getGeodataGeojson: request.server.methods.getGeodataGeojson,
      };

      if (options.type === "region") {
        options.region.id = request.query.regionId;
        options.region.label = request.query.regionLabel;
      }

      const markup = await minimapHelpers.getMinimap(options);

      return h
        .response({
          markup: markup,
        })
        .type("application/json")
        .header("cache-control", helpers.getMaxCache());
    } catch (error) {
      return Boom.notFound();
    }
  },
};
