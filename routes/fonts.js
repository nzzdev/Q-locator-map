const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");
const helpers = require("../helpers/helpers.js");

module.exports = [
  {
    method: "GET",
    path: "/fonts.json",
    options: {
      description: "Returns list of fonts",
      tags: ["api"],
      cors: true
    },
    handler: async function(request, h) {
      return helpers.getFonts();
    }
  },
  {
    method: "GET",
    path: "/fonts/{fontstack}/{start}-{end}.pbf",
    options: {
      description: "Returns fonts in pbf format",
      tags: ["api"],
      validate: {
        params: {
          fontstack: Joi.string().required(),
          start: Joi.number().required(),
          end: Joi.number().required()
        }
      }
    },
    handler: async function(request, h) {
      try {
        const fontstack = request.params.fontstack.split(",");
        const start = request.params.start;
        const end = request.params.end;
        const font = await request.server.methods.getFont(
          fontstack[0],
          start,
          end
        );
        return h
          .response(font)
          .type("application/x-protobuf")
          .header("Content-Encoding", "gzip");
      } catch (error) {
        return Boom.notFound();
      }
    }
  }
];
