const Hapi = require("@hapi/hapi");
const helpers = require("./helpers/helpers.js");

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
      cache: { expiresIn: 60000, generateTimeout: 100 }
    });
  } catch (error) {
    console.log(error);
  }
  await server.register(require("@hapi/inert"));
  await server.register(plugins);
  server.route(routes);
  server.cache.provision({
    provider: {
      constructor: require("@hapi/catbox-memory"),
      options: {
        maxByteSize: 1000000000 // ~ 1GB
      }
    },
    name: "memoryCache"
  });

  await server.start();
  console.log("server running ", server.info.uri);
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
