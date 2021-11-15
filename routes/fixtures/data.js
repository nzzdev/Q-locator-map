const fixtures = require("../../tasks/createFixtureData.js");
const fixturesDir = "../../resources/fixtures/data";

const fixtureData = Object.keys(fixtures).map(fixture =>
  require(`${fixturesDir}/${fixture}.json`)
);

module.exports = {
  path: "/fixtures/data",
  method: "GET",
  options: {
    tags: ["api"],
  },
  handler: (request, h) => {
    return fixtureData;
  }
};
