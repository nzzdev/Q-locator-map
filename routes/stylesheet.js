const helpers = require("../helpers/helpers.js");

module.exports = {
  method: "GET",
  path: "/stylesheet/{filename}.{hash}.{extension}",
  options: {
    files: {
      relativeTo: `${__dirname}/../styles/`
    }
  },
  handler: function(request, h) {
    return h
      .file(`${request.params.filename}.${request.params.extension}`)
      .type("text/css")
      .header("cache-control", helpers.getMaxCache());
  }
};
