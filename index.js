const Hapi = require("@hapi/hapi");
const fs = require("fs");
const util = require("util");
const fetch = require("node-fetch");
const helpers = require("./helpers/helpers.js");
const tileHelpers = require("./helpers/tiles.js");
const geodataHelpers = require("./plugins/geodata/helpers.js");
const resourcesDir = "./resources/";

const serverMethodCacheOptions = {
  expiresIn: 7 * 24 * 60 * 60 * 1000,
  cache: "memoryCache",
  generateTimeout: 2 * 1000,
};

const server = Hapi.server({
  port: process.env.PORT || 3000,
  routes: {
    cors: true,
  },
});

const routes = require("./routes/routes.js");

async function init() {
  try {
    server.cache.provision({
      provider: {
        constructor: require("@hapi/catbox-memory"),
        options: {
          partition: "memoryCache",
          maxByteSize: process.env.MEMORY_CACHE_SIZE || 1000000000, // ~ 1GB
        },
      },
      name: "memoryCache",
    });
    const tilesets = JSON.parse(process.env.TILESETS);
    for (let [key, value] of Object.entries(tilesets)) {
      if (!server.app.tilesets) {
        server.app.tilesets = {};
      }
      if (!server.app.tilesets[key]) {
        server.app.tilesets[key] = {};
      }

      if (value.url) {
        server.app.tilesets[key].url = value.url;
        server.app.tilesets[key].hash = "hash";
      } else if (value.path) {
        server.app.tilesets[key].tileset = await tileHelpers.getTileset(
          value.path
        );
        server.app.tilesets[key].tileset.getTile = util.promisify(
          server.app.tilesets[key].tileset.getTile
        );
        const nameMapping = require(`${resourcesDir}config/nameMapping.json`);
        nameMapping.path = value.path;
        server.app.tilesets[key].hash = await helpers.getHash(nameMapping);
      }
    }

    const basicStyle = require(`${resourcesDir}styles/basic/style.json`);
    const minimalStyle = require(`${resourcesDir}styles/minimal/style.json`);
    const natureStyle = require(`${resourcesDir}styles/nature/style.json`);
    const satelliteStyle = require(`${resourcesDir}styles/satellite/style.json`);
    server.app.styles = {
      basic: {
        style: basicStyle,
        hash: await helpers.getHash(basicStyle),
      },
      minimal: {
        style: minimalStyle,
        hash: await helpers.getHash(minimalStyle),
      },
      nature: {
        style: natureStyle,
        hash: await helpers.getHash(natureStyle),
      },
      satellite: {
        style: satelliteStyle,
        hash: await helpers.getHash(satelliteStyle),
      },
    };

    const sprite1x = fs.readFileSync(`${resourcesDir}sprites/sprites@1x.png`);
    const sprite2x = fs.readFileSync(`${resourcesDir}sprites/sprites@2x.png`);
    const sprite4x = fs.readFileSync(`${resourcesDir}sprites/sprites@4x.png`);
    server.app.sprites = {
      "1x": {
        png: sprite1x,
        json: require(`${resourcesDir}sprites/sprites@1x.json`),
        hash: await helpers.getHash(sprite1x),
      },
      "2x": {
        png: sprite2x,
        json: require(`${resourcesDir}sprites/sprites@2x.json`),
        hash: await helpers.getHash(sprite2x),
      },
      "4x": {
        png: sprite4x,
        json: require(`${resourcesDir}sprites/sprites@4x.json`),
        hash: await helpers.getHash(sprite4x),
      },
    };

    server.method("getTile", tileHelpers.getTile, {
      bind: {
        tilesets: server.app.tilesets,
        styles: server.app.styles,
      },
      cache: serverMethodCacheOptions,
    });

    server.method("getTilesetTile", tileHelpers.getTilesetTile, {
      bind: {
        helpers: helpers,
      },
      generateKey: (item, qId, z, x, y) =>
        `${qId}_${item.updatedDate}_${z}_${x}_${y}`,
      cache: serverMethodCacheOptions,
    });

    if (server.app.tilesets["regions"]) {
      const z = 0;
      const y = 0;
      const x = 0;
      const tiles = [{ z: z, x: x, y: y }];
      if (server.app.tilesets["regions"].url) {
        const tileUrl = server.app.tilesets["regions"].url
          .replace("{z}", z)
          .replace("{x}", y)
          .replace("{y}", x);
        const response = await fetch(tileUrl);
        if (response.ok) {
          const tile = await response.buffer();
          tiles[0].buffer = tile;
        }
      } else if (
        server.app.tilesets["regions"] &&
        server.app.tilesets["regions"].tileset
      ) {
        const tile = await server.app.tilesets["regions"].tileset.getTile(
          z,
          y,
          x
        );
        tiles[0].buffer = tile;
      }
      server.method("getRegionSuggestions", helpers.getRegionSuggestions, {
        bind: {
          server: server,
          tiles: tiles,
        },
        cache: serverMethodCacheOptions,
      });
    }

    server.method("getFont", helpers.getFont, {
      cache: serverMethodCacheOptions,
    });

    server.method("getGeodataGeojson", geodataHelpers.getGeodataGeojson, {
      cache: serverMethodCacheOptions,
    });

    await server.register(require("@hapi/inert"));
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
