const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");

module.exports = {
  method: "GET",
  path: "/styles/{hash}/{id}",
  options: {
    description: "Returns a map style",
    tags: ["api"],
    validate: {
      params: {
        hash: Joi.string().required(),
        id: Joi.string().required()
      }
    },
    handler: async (request, h) => {
      const id = request.params.id;
      const styles = request.server.app.styles;

      if (styles[id] && styles[id].style) {
        return h
          .response(styles[id].style)
          .type("application/json; charset=utf-8")
          .header(
            "cache-control",
            "max-age=31536000, s-maxage=31536000, stale-while-revalidate=31536000, stale-if-error=31536000, immutable"
          );
      } else {
        return Boom.notFound();
      }
    }
  }
};
