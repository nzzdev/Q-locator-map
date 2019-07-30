const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");
const styleHelpers = require("../helpers/styles.js");

module.exports = [
  {
    method: "GET",
    path: "/styles/{id}",
    options: {
      description: "Returns a map style",
      tags: ["api"],
      validate: {
        params: {
          id: Joi.string().required()
        },
        query: {
          toolBaseUrl: Joi.string().required()
        }
      },
      handler: async (request, h) => {
        const id = request.params.id;
        const toolBaseUrl = request.query.toolBaseUrl;
        let item;
        let qId;

        const style = await styleHelpers.getStyle(id, item, toolBaseUrl, qId);
        if (style) {
          return style;
        } else {
          return Boom.notFound();
        }
      }
    }
  },
  {
    method: "POST",
    path: "/styles/{id}",
    options: {
      description: "Returns a map style",
      tags: ["api"],
      validate: {
        params: {
          id: Joi.string().required()
        },
        query: {
          toolBaseUrl: Joi.string().required(),
          qId: Joi.string().required()
        },
        options: {
          allowUnknown: true
        }
      },
      handler: async (request, h) => {
        const id = request.params.id;
        const item = request.payload.item;
        const toolBaseUrl = request.query.toolBaseUrl;
        const qId = request.query.qId;

        const style = await styleHelpers.getStyle(id, item, toolBaseUrl, qId);
        if (style) {
          return style;
        } else {
          return Boom.notFound();
        }
      }
    }
  }
];
