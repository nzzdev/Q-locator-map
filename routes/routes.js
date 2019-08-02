module.exports = [
  require("./rendering-info/web.js"),
  require("./stylesheet.js"),
  require("./script.js"),
  require("./health.js"),
  require("./fixtures/data.js"),
  require("./locales.js"),
  require("./migration.js"),
  require("./option-availability.js"),
  require("./dynamic-schema.js"),
  require("./tiles.js"),
  require("./tilesets.js"),
  require("./fonts.js"),
  require("./sprites.js")
].concat(require("./schema.js"), require("./styles.js"));
