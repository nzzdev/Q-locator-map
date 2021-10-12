const Lab = require("@hapi/lab");
const Code = require("@hapi/code");
const Hapi = require("@hapi/hapi");
const Joi = require("joi");
const lab = (exports.lab = Lab.script());
process.env.OPENCAGE_APIKEY = "test";

const expect = Code.expect;
const before = lab.before;
const after = lab.after;
const it = lab.it;

const helpers = require("../helpers/helpers.js");
const resourcesDir = "../resources/";
const basicStyle = require(`${resourcesDir}styles/basic/style.json`);
const minimalStyle = require(`${resourcesDir}styles/minimal/style.json`);
const natureStyle = require(`${resourcesDir}styles/nature/style.json`);
const satelliteStyle = require(`${resourcesDir}styles/satellite/style.json`);

const routes = require("../routes/routes.js");

const fixturesDir = "../resources/fixtures/data";
const fixtureData = require("../tasks/createFixtureData.js");
const fixtures = Object.keys(fixtureData).map((fixture) =>
  require(`${fixturesDir}/${fixture}.json`)
);

let server;
const toolRuntimeConfig = {
  toolBaseUrl: "http://localhost:3001/tools/locator_map",
  styleConfig: {
    fonts: {
      fontBaseUrl:
        "http://localhost:3001/tools/locator_map/files/locator_map/fonts/",
      fontSansLight: {
        name: "GT-America-Standard-Light",
      },
      fontSansRegular: {
        name: "GT-America-Standard-Regular",
      },
      fontSansMedium: {
        name: "GT-America-Standard-Medium",
      },
      fontSerifRegular: {
        name: "PensumPro-Regular-Italic",
      },
    },
  },
};

before(async () => {
  try {
    server = Hapi.server({
      port: process.env.PORT || 3000,
      routes: {
        cors: true,
      },
    });
    await server.register(require("@hapi/inert"));
    server.validator(Joi);
    server.route(routes);
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

    server.app.sprites = {
      "1x": {
        png: {},
        json: {},
        hash: "hash",
      },
      "2x": {
        png: {},
        json: {},
        hash: "hash",
      },
      "4x": {
        png: {},
        json: {},
        hash: "hash",
      },
    };
  } catch (err) {
    expect(err).to.not.exist();
  }
});

after(async () => {
  await server.stop({ timeout: 2000 });
  server = null;
});

lab.experiment("basics", () => {
  it("starts the server", () => {
    expect(server.info.created).to.be.a.number();
  });

  it("is healthy", async () => {
    const response = await server.inject("/health");
    expect(response.payload).to.equal("ok");
  });
});

lab.experiment("schema endpoint", () => {
  it("returns 200 for /schema.json", async () => {
    const response = await server.inject("/schema.json");
    expect(response.statusCode).to.be.equal(200);
  });
});

lab.experiment("locales endpoint", () => {
  it("returns 200 for en translations", async () => {
    const request = {
      method: "GET",
      url: "/locales/en/translation.json",
    };
    const response = await server.inject(request);
    expect(response.statusCode).to.be.equal(200);
  });
  it("returns 200 for fr translations", async () => {
    const request = {
      method: "GET",
      url: "/locales/fr/translation.json",
    };
    const response = await server.inject(request);
    expect(response.statusCode).to.be.equal(200);
  });
  it("returns 200 for de translations", async () => {
    const request = {
      method: "GET",
      url: "/locales/de/translation.json",
    };
    const response = await server.inject(request);
    expect(response.statusCode).to.be.equal(200);
  });
});

lab.experiment("stylesheets endpoint", () => {
  it(
    "returns existing stylesheet with correct cache control header",
    { plan: 2 },
    async () => {
      const filename = require("../styles/hashMap.json").default;
      const response = await server.inject(`/stylesheet/${filename}`);
      expect(response.statusCode).to.be.equal(200);
      expect(response.headers["cache-control"]).to.be.equal(
        helpers.getMaxCache()
      );
    }
  );

  it("returns Not Found when requesting an inexisting stylesheet", async () => {
    const response = await server.inject("/stylesheet/inexisting.123.css");
    expect(response.statusCode).to.be.equal(404);
  });
});

// all the fixtures render
lab.experiment("all fixtures render", () => {
  for (let fixture of fixtures) {
    it(`doesnt fail in rendering fixture ${fixture.title}`, async () => {
      const request = {
        method: "POST",
        url: "/rendering-info/web",
        payload: {
          item: fixture,
          toolRuntimeConfig: toolRuntimeConfig,
        },
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.be.equal(200);
    });
  }
});

lab.experiment("rendering-info", () => {
  it("web: returns error 400 if invalid item is given", async () => {
    const request = {
      method: "POST",
      url: "/rendering-info/web",
      payload: {
        item: {
          some: "object",
          that: "doesn't validate against the schema",
        },
        toolRuntimeConfig: toolRuntimeConfig,
      },
    };
    const response = await server.inject(request);
    expect(response.statusCode).to.be.equal(400);
  });
});

lab.experiment("assets", () => {
  it("returnes stylesheet", async () => {
    const res = await server.inject({
      url: "/rendering-info/web",
      method: "POST",
      payload: {
        item: fixtures[0],
        toolRuntimeConfig: toolRuntimeConfig,
      },
    });
    const stylesheetRes = await server.inject(
      `/stylesheet/${res.result.stylesheets[0].name}`
    );
    expect(stylesheetRes.statusCode).to.be.equal(200);
  });
});
