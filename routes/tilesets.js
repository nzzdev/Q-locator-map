const Joi = require("joi");
const Boom = require("@hapi/boom");
const helpers = require("../helpers/helpers.js");

module.exports = {
  method: "POST",
  path: "/tilesets/{hash}/{qId}/{z}/{x}/{y}.pbf",
  options: {
    description: "Returns the tileset in pbf format",
    tags: ["api"],
    validate: {
      params: {
        hash: Joi.string().required(),
        qId: Joi.string().required(),
        z: Joi.number().required(),
        x: Joi.number().required(),
        y: Joi.number().required(),
      },
      options: {
        allowUnknown: true,
      },
    },
    handler: async (request, h) => {
      try {
        const item = request.payload.item;
        const qId = request.params.qId;
        const z = request.params.z;
        const x = request.params.x;
        const y = request.params.y;
        const tile = await request.server.methods.getTilesetTile(
          item,
          qId,
          z,
          x,
          y
        );

        return h
          .response(tile)
          .type("application/x-protobuf")
          .header("Content-Encoding", "gzip")
          .header("cache-control", helpers.getMaxCache());
      } catch (error) {
        return Boom.notFound();
      }
    },
  },
};
