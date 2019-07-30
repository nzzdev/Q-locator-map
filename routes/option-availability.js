const Boom = require("@hapi/boom");
const Joi = require("@hapi/joi");

module.exports = {
  method: "POST",
  path: "/option-availability/{optionName}",
  options: {
    validate: {
      payload: Joi.object()
    },
    cors: true
  },
  handler: function(request, h) {
    const item = request.payload.item;
    if (request.params.optionName === "minimap-options") {
      return {
        available: item.options.minimap.showMinimap
      };
    }

    if (request.params.optionName === "region") {
      return {
        available: item.options.minimap.options.type === "region"
      };
    }

    return Boom.badRequest();
  }
};
