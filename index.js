const Hapi = require("@hapi/hapi");
const fs = require("fs");
const NodeGeocoder = require("node-geocoder");
const helpers = require("./helpers/helpers.js");
const tileHelpers = require("./helpers/tiles.js");
const geodataHelpers = require("./plugins/geodata/helpers.js");
const resourcesDir = "./resources/";

const serverMethodCacheOptions = {
  expiresIn: 7 * 24 * 60 * 60 * 1000,
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
          maxByteSize: process.env.MEMORY_CACHE_SIZE || 1000000000 // ~ 1GB
        }
      },
      name: "memoryCache"
    });
    const tilesets = JSON.parse(process.env.TILESETS);
    for (let [key, value] of Object.entries(tilesets)) {
      if (value.path) {
        if (!server.app.tilesets) {
          server.app.tilesets = {};
        }
        if (!server.app.tilesets[key]) {
          server.app.tilesets[key] = {};
        }
        server.app.tilesets[key].tileset = await tileHelpers.getTileset(
          value.path
        );
        server.app.tilesets[key].hash = await helpers.getHash(value.path);
      }
    }

    const basicStyle = require(`${resourcesDir}styles/basic/style.json`);
    const minimalStyle = require(`${resourcesDir}styles/minimal/style.json`);
    const natureStyle = require(`${resourcesDir}styles/nature/style.json`);
    const satelliteStyle = require(`${resourcesDir}styles/satellite/style.json`);
    server.app.styles = {
      basic: {
        style: basicStyle,
        hash: await helpers.getHash(basicStyle)
      },
      minimal: {
        style: minimalStyle,
        hash: await helpers.getHash(minimalStyle)
      },
      nature: {
        style: natureStyle,
        hash: await helpers.getHash(natureStyle)
      },
      satellite: {
        style: satelliteStyle,
        hash: await helpers.getHash(satelliteStyle)
      }
    };

    const sprite1x = fs.readFileSync(`${resourcesDir}sprites/sprites@1x.png`);
    const sprite2x = fs.readFileSync(`${resourcesDir}sprites/sprites@2x.png`);
    const sprite4x = fs.readFileSync(`${resourcesDir}sprites/sprites@4x.png`);
    server.app.sprites = {
      "1x": {
        png: sprite1x,
        json: require(`${resourcesDir}sprites/sprites@1x.json`),
        hash: await helpers.getHash(sprite1x)
      },
      "2x": {
        png: sprite2x,
        json: require(`${resourcesDir}sprites/sprites@2x.json`),
        hash: await helpers.getHash(sprite2x)
      },
      "4x": {
        png: sprite4x,
        json: require(`${resourcesDir}sprites/sprites@4x.json`),
        hash: await helpers.getHash(sprite4x)
      }
    };

    server.method("getTile", tileHelpers.getTile, {
      bind: {
        tilesets: server.app.tilesets,
        styles: server.app.styles
      },
      cache: serverMethodCacheOptions
    });

    server.method("getTilesetTile", tileHelpers.getTilesetTile, {
      bind: {
        helpers: helpers
      },
      generateKey: (item, qId, z, x, y) =>
        `${qId}_${item.updatedDate}_${z}_${x}_${y}`,
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
