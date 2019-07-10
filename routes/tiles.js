const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");
const fetch = require("node-fetch");

module.exports = {
  method: "GET",
  path: "/tiles/{id}/{z}/{x}/{y}.{type}",
  options: {
    description: "Returns the tiles in pbf format",
    tags: ["api"],
    validate: {
      params: {
        id: Joi.string().required(),
        z: Joi.number().required(),
        x: Joi.number().required(),
        y: Joi.number().required(),
        type: Joi.string().required()
      },
      options: {
        allowUnknown: true
      }
    },
    handler: async (request, h) => {
      const id = request.params.id;
      const z = request.params.z;
      const x = request.params.x;
      const y = request.params.y;
      const type = request.params.type;
      const tilesets = JSON.parse(process.env.TILESETS);

      try {
        if (tilesets[id] && tilesets[id].url) {
          const tileUrl = tilesets[id].url
            .replace("{z}", z)
            .replace("{x}", x)
            .replace("{y}", y);
          const response = await fetch(tileUrl);
          if (response.ok) {
            if (type === "png") {
              return h.response(response.body).type("image/png");
            } else {
              return h.response(response.body).type("application/x-protobuf");
            }
          } else {
            return new Error();
          }
        } else {
          const tile = await request.server.methods.getTile(id, z, x, y);
          if (type === "png") {
            return h.response(tile).type("image/png");
          } else {
            return h
              .response(tile)
              .type("application/x-protobuf")
              .header("Content-Encoding", "gzip");
          }
        }
      } catch (error) {
        return Boom.notFound();
      }
    }
  }
};
