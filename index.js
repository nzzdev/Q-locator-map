const Hapi = require("@hapi/hapi");
const NodeGeocoder = require("node-geocoder");
const helpers = require("./helpers/helpers.js");
const geodataHelpers = require("./plugins/geodata/helpers.js");

const serverMethodCacheOptions = {
  expiresIn: 365 * 24 * 60 * 60 * 1000,
  cache: "memoryCache",
  generateTimeout: 2 * 1000
};

const server = Hapi.server({
  port: process.env.PORT || 3000,
  routes: {
    cors: true
  }
});

const plugins = [
  {
    plugin: require("./plugins/geodata/index.js")
  }
];
const routes = require("./routes/routes.js");

async function init() {
  try {
    server.app.geocoder = NodeGeocoder({
      provider: "opencage",
      apiKey: process.env.OPENCAGE_APIKEY
    });

    server.cache.provision({
      provider: {
        constructor: require("@hapi/catbox-memory"),
        options: {
          partition: "memoryCache",
          maxByteSize: 1000000000 // ~ 1GB
        }
      },
      name: "memoryCache"
    });
    const tilesets = JSON.parse(process.env.TILESETS);
    for (let [key, value] of Object.entries(tilesets)) {
      if (value.path) {
        server.app.tilesets = server.app.tilesets || {};
        server.app.tilesets[key] = await helpers.getTileset(value.path);
      }
    }

    server.method("getTile", helpers.getTile, {
      bind: {
        tilesets: server.app.tilesets
      },
      cache: serverMethodCacheOptions
    });

    server.method("getTilesetTile", helpers.getTilesetTile, {
      generateKey: (item, id, z, x, y) =>
        `${item._id}_${item.updatedDate}_${id}_${z}_${x}_${y}`,
      cache: serverMethodCacheOptions
    });

    server.method("getRegionSuggestions", helpers.getRegionSuggestions, {
      bind: {
        server: server
      },
      generateKey: components => {
        let key = "";
        for (let component of components) {
          key = `${key}_${component[0]}_${component[1]}`;
        }
        return key;
      },
      cache: serverMethodCacheOptions
    });

    server.method("getFont", helpers.getFont, {
      cache: serverMethodCacheOptions
    });

    server.method("getGeodataGeojson", geodataHelpers.getGeodataGeojson, {
      cache: serverMethodCacheOptions
    });

    server.method("getGeodataTile", geodataHelpers.getGeodataTile, {
      bind: {
        server: server
      },
      cache: serverMethodCacheOptions
    });

    await server.register(require("@hapi/inert"));
    await server.register(plugins);
    server.route(routes);

    await server.start();
    console.log("server running ", server.info.uri);
  } catch (error) {
    console.log(error);
  }
}

async function gracefullyStop() {
  console.log("stopping hapi server");
  try {
    await server.stop({ timeout: 10000 });
    console.log("hapi server stopped");
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
  process.exit(0);
}

// listen on SIGINT and SIGTERM signal and gracefully stop the server
process.on("SIGINT", gracefullyStop);
process.on("SIGTERM", gracefullyStop);

init();
