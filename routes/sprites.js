const path = require("path");
const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");
const spritesDir = `${__dirname}/../resources/sprites/`;

module.exports = {
  method: "GET",
  path: "/sprites/{id}.{extension}",
  options: {
    description: "Returns the sprites",
    tags: ["api"],
    validate: {
      params: {
        id: Joi.string().required(),
        extension: Joi.string().required()
      }
    }
  },
  handler: function(request, h) {
    try {
      let id = request.params.id;
      const extension = request.params.extension;
      let spritePath = path.join(spritesDir, `sprites.${extension}`);
      if (id.includes("2x")) {
        id = id.replace("@2x", "");
        spritePath = path.join(spritesDir, `sprites@2x.${extension}`);
      } else if (id.includes("4x")) {
        id = id.replace("@4x", "");
        spritePath = path.join(spritesDir, `sprites@4x.${extension}`);
      }

      return h
        .file(spritePath)
        .header("cache-control", `max-age=${60 * 60 * 24 * 365}, immutable`);
    } catch (error) {
      return Boom.notFound();
    }
  }
};
