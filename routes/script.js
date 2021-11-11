const helpers = require("../helpers/helpers.js");

module.exports = {
  method: "GET",
  path: "/script/{filename}.{hash}.{extension}",
  options: {
    files: {
      relativeTo: `${__dirname}/../scripts/`
    }
  },
  handler: function(request, h) {
    return h
      .file(`${request.params.filename}.${request.params.extension}`)
      .type("text/javascript")
      .header("cache-control", helpers.getMaxCache());
  }
};
