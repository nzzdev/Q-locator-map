const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");
const fetch = require("node-fetch");

module.exports = {
  method: "POST",
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

      if (process.env.TILE_URL) {
        const tileUrl = `${process.env.TILE_URL}/${z}/${x}/${y}.pbf`;
        const response = await fetch(tileUrl);
        if (response) {
          return response.body;
        } else {
          return Boom.notFound();
        }
      } else {
        const mbtiles = request.server.app.mbtiles;
        return new Promise((resolve, reject) => {
          mbtiles.getTile(z, x, y, (err, data) => {
            if (err) {
              resolve(Boom.notFound());
            } else {
              resolve(
                h
                  .response(data)
                  .type("application/x-protobuf")
                  .header("Content-Encoding", "gzip")
                  .header(
                    "cache-control",
                    "max-age=31536000, s-maxage=31536000, stale-while-revalidate=31536000, stale-if-error=31536000, immutable"
                  )
              );
            }
          });
        });
      }
    }
  }
};
