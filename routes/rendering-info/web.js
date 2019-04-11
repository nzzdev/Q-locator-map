const Boom = require("boom");
const fs = require("fs");
const path = require("path");

const stylesDir = path.join(__dirname, "/../../styles/");
const styleHashMap = require(path.join(stylesDir, "hashMap.json"));
const scriptsDir = `${__dirname}/../../scripts/`;
const scriptHashMap = require(`${scriptsDir}/hashMap.json`);
const viewsDir = `${__dirname}/../../views/`;
const helpers = require(path.join(__dirname, "/../../helpers/helpers.js"));

require("svelte/ssr/register");
const template = require(`${viewsDir}/locator-map.html`);

// POSTed item will be validated against given schema
// hence we fetch the JSON schema...
const schemaString = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../resources/", "schema.json"), {
    encoding: "utf-8"
  })
);
const Ajv = require("ajv");
const ajv = new Ajv();

const validate = ajv.compile(schemaString);
function validateAgainstSchema(item, options) {
  if (validate(item)) {
    return item;
  } else {
    throw Boom.badRequest(JSON.stringify(validate.errors));
  }
}

async function validatePayload(payload, options, next) {
  if (typeof payload !== "object") {
    return next(Boom.badRequest(), payload);
  }
  if (typeof payload.item !== "object") {
    return next(Boom.badRequest(), payload);
  }
  if (typeof payload.toolRuntimeConfig !== "object") {
    return next(Boom.badRequest(), payload);
  }
  await validateAgainstSchema(payload.item, options);
}

module.exports = {
  method: "POST",
  path: "/rendering-info/web",
  options: {
    validate: {
      options: {
        allowUnknown: true
      },
      payload: validatePayload
    }
  },
  handler: async function(request, h) {
    const item = request.payload.item;
    item.id = request.query._id;

    const context = {
      item: item,
      displayOptions: request.payload.toolRuntimeConfig.displayOptions || {},
      id: `q_locator_map_${request.query._id}_${Math.floor(
        Math.random() * 100000
      )}`.replace(/-/g, ""),
      mapConfig: {
        ...JSON.parse(process.env.MAP_CONFIG),
        ...helpers.getMapConfig(item)
      }
    };

    const renderingInfo = {
      polyfills: ["Promise"],
      stylesheets: [
        {
          name: styleHashMap["default"]
        },
        {
          url: "https://api.tiles.mapbox.com/mapbox-gl-js/v0.53.1/mapbox-gl.css"
        }
      ],
      scripts: [
        {
          url: "https://api.tiles.mapbox.com/mapbox-gl-js/v0.53.1/mapbox-gl.js"
        },
        {
          name: scriptHashMap["default"]
        },
        {
          content: `new window._q_locator_map.LocatorMap('${`${
            context.id
          }_container`}', '${JSON.stringify(context)}')`
        }
      ],
      markup: template.render(context).html
    };

    return renderingInfo;
  }
};
