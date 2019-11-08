const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");

module.exports = [
  {
    method: "GET",
    path: "/fonts/{hash}.json",
    options: {
      description: "Returns list of fonts",
      tags: ["api"],
      cors: true
    },
    handler: async function(request, h) {
      return [
        "GT-America-Standard-Light",
        "GT-America-Standard-Regular",
        "GT-America-Standard-Medium",
        "PensumPro-Regular",
        "PensumPro-Regular-Italic",
        "UniversLTStd-Light",
        "UniversLTStd",
        "UniversLTStd-Black"
      ];
    }
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
          end: Joi.number().required()
        },
        query: {
          fontBaseUrl: Joi.string().required()
        }
      }
    },
    handler: async function(request, h) {
      try {
        const fontBaseUrl = request.query.fontBaseUrl;
        const fontstack = request.params.fontstack.split(",");
        const start = request.params.start;
        const end = request.params.end;
        const font = await request.server.methods.getFont(
          fontBaseUrl,
          fontstack[0],
          start,
          end
        );
        return h
          .response(font)
          .type("application/x-protobuf")
          .header("Content-Encoding", "gzip")
          .header(
            "cache-control",
            "max-age=31536000, s-maxage=31536000, stale-while-revalidate=31536000, stale-if-error=31536000, immutable"
          );
      } catch (error) {
        return Boom.notFound();
      }
    }
  }
];
