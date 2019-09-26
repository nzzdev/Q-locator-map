const spritezero = require("@mapbox/spritezero");
const fs = require("fs");
const glob = require("glob");
const path = require("path");

[1, 2, 4].forEach(pxRatio => {
  const svgs = glob
    .sync(path.resolve(path.join(__dirname, "marker/*.svg")))
    .map(f => {
      return {
        id: path.basename(f).replace(".svg", ""),
        svg: fs.readFileSync(f)
      };
    });

  const pngPath = path.resolve(
    path.join(__dirname, "sprites@" + pxRatio + "x.png")
  );
  const jsonPath = path.resolve(
    path.join(__dirname, "sprites@" + pxRatio + "x.json")
  );

  // Pass `true` in the layout parameter to generate a data layout
  // suitable for exporting to a JSON sprite manifest file.
  spritezero.generateLayout(
    { imgs: svgs, pixelRatio: pxRatio, format: true },
    function(err, dataLayout) {
      if (err) return;
      fs.writeFileSync(jsonPath, JSON.stringify(dataLayout));
    }
  );

  // Pass `false` in the layout parameter to generate an image layout
  // suitable for exporting to a PNG sprite image file.
  spritezero.generateLayout(
    { imgs: svgs, pixelRatio: pxRatio, format: false },
    function(err, imageLayout) {
      spritezero.generateImage(imageLayout, function(err, image) {
        if (err) return;
        fs.writeFileSync(pngPath, image);
      });
    }
  );
});
