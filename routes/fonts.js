const Joi = require("joi");
const Boom = require("@hapi/boom");
const helpers = require("../helpers/helpers.js");

module.exports = [
  {
    method: "GET",
    path: "/fonts/{hash}.json",
    options: {
      description: "Returns list of fonts",
      tags: ["api"],
      cors: true,
    },
    handler: async function (request, h) {
      return [
        "GT-America-Standard-Light",
        "GT-America-Standard-Regular",
        "GT-America-Standard-Medium",
        "PensumPro-Regular-Italic",
        "UniversLTStd-LightCn",
        "UniversNextPro-MediumCond",
      ];
    },
  },
  {
    method: "GET",
    path: "/fonts/{hash}/{fontstack}/{start}-{end}.pbf",
    options: {
      description: "Returns fonts in pbf format",
      tags: ["api"],
      validate: {
        params: {
          hash: Joi.string().required(),
          fontstack: Joi.string().required(),
          start: Joi.number().required(),
          end: Joi.number().required(),
        },
        query: {
          fontBaseUrl: Joi.string().required(),
        },
      },
    },
    handler: async function (request, h) {
      try {
        const hash = request.params.hash;
        const fontBaseUrl = request.query.fontBaseUrl;
        const fontstack = request.params.fontstack.split(",");
        const start = request.params.start;
        const end = request.params.end;
        const font = await request.server.methods.getFont(
          hash,
          fontBaseUrl,
          fontstack[0],
          start,
          end
        );
        return h
          .response(font)
          .type("application/x-protobuf")
          .header("Content-Encoding", "gzip")
          .header("cache-control", helpers.getMaxCache());
      } catch (error) {
        return Boom.notFound();
      }
    },
  },
];
