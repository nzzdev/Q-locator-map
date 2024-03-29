const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const sass = require("sass");
const postcss = require("postcss");
const postcssImport = require("postcss-import");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const rollup = require("rollup");
const buble = require("@rollup/plugin-buble");
const { terser } = require("rollup-plugin-terser");
const { nodeResolve } = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const json = require("@rollup/plugin-json");

const stylesDir = `${__dirname}/../styles_src/`;
const scriptsDir = `${__dirname}/../scripts_src/`;
const createFixtureData = require("./createFixtureData.js");

function writeHashmap(hashmapPath, files, fileext) {
  const hashMap = {};
  files
    .map((file) => {
      const hash = crypto.createHash("md5");
      hash.update(file.content, { encoding: "utf8" });
      file.hash = hash.digest("hex");
      return file;
    })
    .map((file) => {
      hashMap[file.name] = `${file.name}.${file.hash.substring(
        0,
        8
      )}.${fileext}`;
    });

  fs.writeFileSync(hashmapPath, JSON.stringify(hashMap));
}

async function compileStylesheet(name) {
  return new Promise((resolve, reject) => {
    const filePath = `${stylesDir}${name}.scss`;
    fs.access(filePath, fs.constants.R_OK, (err) => {
      if (err) {
        reject(new Error(`stylesheet ${filePath} cannot be read`));
        process.exit(1);
      }
      sass.render(
        {
          file: filePath,
          outputStyle: "compressed",
        },
        (err, sassResult) => {
          if (err) {
            reject(err);
          } else {
            postcss()
              .use(postcssImport)
              .use(autoprefixer)
              .use(cssnano)
              .process(sassResult.css, {
                from: `${stylesDir}${name}.css`,
              })
              .then((prefixedResult) => {
                if (prefixedResult.warnings().length > 0) {
                  console.log(`failed to compile stylesheet ${name}`);
                  process.exit(1);
                }
                resolve(prefixedResult.css);
              });
          }
        }
      );
    });
  });
}

async function buildStyles() {
  try {
    // compile styles
    const styleFiles = [
      {
        name: "default",
        content: await compileStylesheet("default"),
      },
    ];

    styleFiles.map((file) => {
      fs.writeFileSync(`styles/${file.name}.css`, file.content);
    });

    writeHashmap("styles/hashMap.json", styleFiles, "css");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

async function buildScripts() {
  try {
    const filename = "default";
    const inputOptions = {
      input: `${scriptsDir}${filename}.js`,
      plugins: [
        json({ namedExports: false }),
        buble({ transforms: { dangerousForOf: true } }),
        terser(),
        nodeResolve({ browser: true }),
        commonjs(),
      ],
    };
    const outputOptions = {
      format: "iife",
      name: "window._q_locator_map.LocatorMap",
      file: `scripts/${filename}.js`,
      sourcemap: false,
    };
    // create the bundle and write it to disk
    const bundle = await rollup.rollup(inputOptions);
    const { output } = await bundle.generate(outputOptions);
    await bundle.write(outputOptions);

    const scriptFiles = [
      {
        name: filename,
        content: output[0].code,
      },
    ];

    writeHashmap("scripts/hashMap.json", scriptFiles, "js");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

function buildFixtures() {
  for (let [key, value] of Object.entries(createFixtureData)) {
    fs.writeFileSync(
      path.join("resources/fixtures/data/", `${key}.json`),
      JSON.stringify(value())
    );
  }
}

Promise.all([buildScripts(), buildStyles(), buildFixtures()])
  .then((res) => {
    console.log("build complete");
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
