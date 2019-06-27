const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");

module.exports = {
  method: "GET",
  path: "/tiles/{z}/{x}/{y}.pbf",
  options: {
    description: "Returns the tiles in pbf format",
    tags: ["api"],
    validate: {
      params: {
        z: Joi.number().required(),
        x: Joi.number().required(),
        y: Joi.number().required()
      },
      options: {
        allowUnknown: true
      }
    },
    handler: async (request, h) => {
      const z = request.params.z;
      const x = request.params.x;
      const y = request.params.y;

      try {
        if (process.env.TILE_URL) {
          const tileUrl = `${process.env.TILE_URL}/${z}/${x}/${y}.pbf`;
          const response = await fetch(tileUrl);
          if (response.ok) {
            return response.body;
          } else {
            return new Error();
          }
        } else {
          const tile = await request.server.methods.getTile(z, x, y);
          return h
            .response(tile)
            .type("application/x-protobuf")
            .header("Content-Encoding", "gzip")
            .header(
              "cache-control",
              "max-age=31536000, s-maxage=31536000, stale-while-revalidate=31536000, stale-if-error=31536000, immutable"
            );
        }
      } catch (error) {
        return Boom.notFound();
      }
    }
  }
};
