const path = require("path");
const Joi = require("@hapi/joi");
const stylesDir = `${__dirname}/../resources/styles/`;

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
    const id = request.params.id;
    const extension = request.params.extension;
    const spritePath = path.join(stylesDir, id, `sprites/sprites.${extension}`);
    return h.file(spritePath);
  }
};
