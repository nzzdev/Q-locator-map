const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const Lab = require("@hapi/lab");
const Code = require("@hapi/code");
const lab = (exports.lab = Lab.script());

const expect = Code.expect;
const it = lab.it;

const fixturesDir = "../resources/fixtures/data";
const fixtureData = require("../tasks/createFixtureData.js");
const fixtures = Object.keys(fixtureData).map(fixture =>
  require(`${fixturesDir}/${fixture}.json`)
);
const defaultGeojsonStyles = require("../helpers/styles.js").getDefaultGeojsonStyles();

// setup svelte
require("svelte/register");
const staticTemplate = require("../views/LocatorMap.svelte").default;

const context = {
  item: fixtures[4],
  displayOptions: {},
  defaultGeojsonStyles: defaultGeojsonStyles
};

const markup = staticTemplate.render(context).html;

function getElement(selector) {
  return new Promise((resolve, reject) => {
    const dom = new JSDOM(markup);
    resolve(dom.window.document.querySelector(selector));
  });
}

lab.experiment("DOM tests", () => {
  it("should have a correct title element", () => {
    return getElement(".s-q-item__title").then(element => {
      expect(element.innerHTML).to.not.equal("");
    });
  });

  it("should have a correct subtitle element", () => {
    return getElement(".s-q-item__subtitle").then(element => {
      expect(element.innerHTML).to.be.equal("subtitle");
    });
  });

  it("should have a correct footer element", () => {
    return getElement(".s-q-item__footer").then(element => {
      expect(element.innerHTML).to.not.equal("");
    });
  });
});
