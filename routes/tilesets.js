const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");
const vtpbf = require("vt-pbf");
const geojsonvt = require("geojson-vt");
const zlib = require("zlib");

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
    handler: (request, h) => {
      const item = request.payload.item;
      const id = request.params.id;
      const z = request.params.z;
      const x = request.params.x;
      const y = request.params.y;

      if (id >= 0 && id < item.geojsonList.length) {
        const tileIndex = geojsonvt(item.geojsonList[id]);
        const tile = tileIndex.getTile(z, x, y);
        if (tile) {
          const tileObject = {};
          tileObject[`source-${id}`] = tile;
          const protobuf = zlib.gzipSync(
            vtpbf.fromGeojsonVt(tileObject, { version: 2 })
          );
          return h
            .response(protobuf)
            .type("application/x-protobuf")
            .header("Content-Encoding", "gzip");
        } else {
          return Boom.notFound();
        }
      } else {
        return Boom.notFound();
      }
    }
  }
};
