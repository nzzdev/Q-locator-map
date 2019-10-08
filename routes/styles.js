const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");

const resourcesDir = "../resources/";
const basicStyle = require(`${resourcesDir}styles/basic/style.json`);
const minimalStyle = require(`${resourcesDir}styles/minimal/style.json`);
const natureStyle = require(`${resourcesDir}styles/nature/style.json`);
const satelliteStyle = require(`${resourcesDir}styles/satellite/style.json`);

function getStyleJSON(id, toolBaseUrl) {
  let style;
  if (id === "nature") {
    style = JSON.stringify(natureStyle);
  } else if (id === "satellite") {
    style = JSON.stringify(satelliteStyle);
  } else if (id === "minimal") {
    style = JSON.stringify(minimalStyle);
  } else {
    style = JSON.stringify(basicStyle);
  }
  style = JSON.parse(
    style
      .replace(/\${mapbox_access_token}/g, process.env.MAPBOX_ACCESS_TOKEN)
      .replace(/\${toolBaseUrl}/g, toolBaseUrl)
  );

  return style;
}

module.exports = {
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

      const style = await getStyleJSON(id, toolBaseUrl);
      if (style) {
        return h
          .response(style)
          .type("application/json; charset=utf-8")
          .header("cache-control", `max-age=${60 * 60 * 24 * 2}, immutable`);
      } else {
        return Boom.notFound();
      }
    }
  }
};
