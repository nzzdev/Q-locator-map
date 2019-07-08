const Boom = require("@hapi/boom");
const fs = require("fs");

const stylesDir = "../../styles/";
const styleHashMap = require(`${stylesDir}hashMap.json`);
const scriptsDir = "../../scripts/";
const scriptHashMap = require(`${scriptsDir}/hashMap.json`);
const viewsDir = `${__dirname}/../../views/`;
const helpers = require("../../helpers/helpers.js");

// setup nunjucks environment
const nunjucks = require("nunjucks");
const nunjucksEnv = new nunjucks.Environment();

// POSTed item will be validated against given schema
// hence we fetch the JSON schema...
const schemaString = JSON.parse(
  fs.readFileSync(`${__dirname}/../../resources/schema.json`, {
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
    const toolRuntimeConfig = request.payload.toolRuntimeConfig;
    item.id = request.query._id;

    const context = {
      item: item,
      displayOptions: toolRuntimeConfig.displayOptions || {},
      id: `q_locator_map_${request.query._id}_${Math.floor(
        Math.random() * 100000
      )}`.replace(/-/g, ""),
      mapConfig: await helpers.getMapConfig(
        item,
        toolRuntimeConfig,
        request.query._id
      ),
      width: helpers.getExactPixelWidth(toolRuntimeConfig)
    };

    const renderingInfo = {
      polyfills: ["Promise"],
      stylesheets: [
        {
          name: styleHashMap["default"]
        }
      ],
      scripts: [
        {
          name: scriptHashMap["default"]
        },
        {
          content: `new window._q_locator_map.LocatorMap(document.querySelector('#${
            context.id
          }_container'), JSON.parse('${JSON.stringify({
            mapConfig: context.mapConfig,
            options: context.item.options,
            width: context.width
          })}'))`
        }
      ],
      markup: nunjucksEnv.render(`${viewsDir}/locator-map.html`, context)
    };

    return renderingInfo;
  }
};
