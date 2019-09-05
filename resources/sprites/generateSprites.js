const spritezero = require("@mapbox/spritezero");
const maki = require("@mapbox/maki");
const fs = require("fs");
const path = require("path");

const epiCenterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">
<g fill="#B23C39" fill-rule="evenodd">
  <circle cx="21" cy="21" r="21" fill-opacity=".2"/>
  <circle cx="21" cy="21" r="16" fill-opacity=".2"/>
  <circle cx="21" cy="21" r="11" fill-opacity=".2"/>
  <circle cx="21" cy="21" r="7" fill-opacity=".2"/>
  <circle cx="21" cy="21" r="3"/>
</g>
</svg>`;
const pointSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">
<circle cx="5" cy="5" r="4" fill-rule="evenodd" stroke="#FFF" stroke-width="2"/>
</svg>`;

[1, 2, 4].forEach(pxRatio => {
  const svgs = maki.layouts.all.all.map((icon, index) => {
    return {
      id: icon + "-11",
      svg: Buffer.from(maki.svgArray[index * 2], "utf8")
    };
  });
  svgs.push({
    id: "epicenter-42",
    svg: Buffer.from(epiCenterSvg, "utf8")
  });

  svgs.push({
    id: "point-10",
    svg: Buffer.from(pointSvg, "utf8")
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
