const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");

module.exports = {
  method: "POST",
  path: "/tilesets/{id}/{z}/{x}/{y}.pbf",
  options: {
    description: "Returns the tileset in pbf format",
    tags: ["api"],
    validate: {
      params: {
        id: Joi.number().required(),
        z: Joi.number().required(),
        x: Joi.number().required(),
        y: Joi.number().required()
      },
      options: {
        allowUnknown: true
      }
    },
    handler: async (request, h) => {
      try {
        const item = request.payload.item;
        const id = request.params.id;
        const z = request.params.z;
        const x = request.params.x;
        const y = request.params.y;
        const tile = await request.server.methods.getTilesetTile(
          item,
          id,
          z,
          x,
          y
        );

        return h
          .response(tile)
          .type("application/x-protobuf")
          .header("Content-Encoding", "gzip");
      } catch (error) {
        return Boom.notFound();
      }
    }
  }
};
