const fs = require("fs");
const path = require("path");
const Joi = require("@hapi/joi");
const Boom = require("@hapi/boom");
const fontnik = require("fontnik");
const glyphCompose = require("@mapbox/glyph-pbf-composite");
const fontsDir = `${__dirname}/../resources/fonts/`;
const notoSansRegular = fs.readFileSync(
  path.join(fontsDir, "NotoSans-Regular.ttf")
);
const notoSansBold = fs.readFileSync(path.join(fontsDir, "NotoSans-Bold.ttf"));
const notoSansItalic = fs.readFileSync(
  path.join(fontsDir, "NotoSans-Italic.ttf")
);

function getFont(font) {
  if (font === "Noto Sans Regular") {
    return notoSansRegular;
  } else if (font === "Noto Sans Bold") {
    return notoSansBold;
  } else if (font === "Noto Sans Italic") {
    return notoSansItalic;
  } else {
    return notoSansRegular;
  }
}

module.exports = {
  method: "GET",
  path: "/fonts/{fontstack}/{start}-{end}.pbf",
  options: {
    description: "Returns fonts in pbf format",
    tags: ["api"],
    validate: {
      params: {
        fontstack: Joi.string().required(),
        start: Joi.number().required(),
        end: Joi.number().required()
      }
    }
  },
  handler: async function(request, h) {
    try {
      const fontstack = request.params.fontstack.split(",");
      const start = request.params.start;
      const end = request.params.end;
      const font = getFont(fontstack[0]);
      const result = await new Promise((resolve, reject) => {
        fontnik.range(
          {
            font: font,
            start: start,
            end: end
          },
          (err, data) => {
            if (err) {
              reject();
            } else {
              resolve(data);
            }
          }
        );
      });
      const combined = glyphCompose.combine([result]);
      return h.response(combined).type("application/x-protobuf");
    } catch (error) {
      return Boom.notFound();
    }
  }
};
