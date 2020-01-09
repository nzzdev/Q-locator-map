const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");

module.exports = {
  method: "GET",
  path: "/sprites/{hash}/{id}.{extension}",
  options: {
    description: "Returns the sprites",
    tags: ["api"],
    validate: {
      params: {
        hash: Joi.string().required(),
        id: Joi.string().required(),
        extension: Joi.string().required()
      }
    }
  },
  handler: function(request, h) {
    try {
      let id = request.params.id;
      const sprites = request.server.app.sprites;
      const extension = request.params.extension;
      const mimeType =
        extension === "json" ? "application/json; charset=utf-8" : "image/png";

      let spriteFile = sprites["1x"][extension];
      if (id.includes("2x")) {
        spriteFile = sprites["2x"][extension];
      } else if (id.includes("4x")) {
        spriteFile = sprites["4x"][extension];
      }

      return h
        .response(spriteFile)
        .type(mimeType)
        .header(
          "cache-control",
          "max-age=31536000, s-maxage=31536000, stale-while-revalidate=31536000, stale-if-error=31536000, immutable"
        );
    } catch (error) {
      return Boom.notFound();
    }
  }
};
