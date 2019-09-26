const Boom = require("@hapi/boom");
const Joi = require("@hapi/joi");

function hasLabelsBelowMap(item) {
  return item.options.labelsBelowMap === true;
}

function hasMoreThanOneLabel(item) {
  return Array.isArray(item.geojsonList) && item.geojsonList.length > 1;
}

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

    if (request.params.optionName === "labelsBelowMapOneRow") {
      return {
        available: hasLabelsBelowMap(item) && hasMoreThanOneLabel(item)
      };
    }
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

    if (request.params.optionName === "useDefaultAspectRatio") {
      return {
        available:
          item.options.dimension &&
          item.options.dimension.bbox &&
          item.options.dimension.bbox.length === 4
      };
    }

    return Boom.badRequest();
  }
};
