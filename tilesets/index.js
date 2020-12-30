const fs = require("fs-extra");
const util = require("util");
const progress = require("progress-stream");
const fetch = require("node-fetch");
const tilelive = require("@mapbox/tilelive");
const loadTileset = util.promisify(tilelive.load);
const copyTileset = util.promisify(tilelive.copy);
const mbtiles = require("@mapbox/mbtiles");
const rmdir = util.promisify(fs.rmdir);
const move = util.promisify(require("mv"));
const unlink = util.promisify(fs.unlink);
const path = require("path");
const { getTransformStream, report } = require("./helpers.js");

mbtiles.registerProtocols(tilelive);

async function downloadTileset(url, path, size) {
  try {
    console.log(`Downloading ${url} to ${path}...`);
    await fs.ensureFile(path);

    const response = await fetch(url);
    if (response.ok) {
      const progressStream = progress({
        length: size,
        time: 1000 /* ms */,
      });
      progressStream.on("progress", (progress) => {
        console.log(
          `Progress: ${Math.round(progress.percentage * 10) / 10} %\r`
        );
      });
      const result = await new Promise((resolve, reject) => {
        response.body
          .pipe(progressStream)
          .pipe(fs.createWriteStream(path))
          .on("error", (error) => reject(error))
          .on("finish", () => {
            resolve(`Download finished. Saved ${url} to ${path}.`);
          });
      });
      console.log(result);
    }
  } catch (error) {
    console.log(error);
  }
}

async function transformTileset(path) {
  try {
    const sourceTileset = await loadTileset(`mbtiles://./${path}`);
    const transformedTileset = await loadTileset(
      `mbtiles://./${path}-transformed`
    );

    const options = {
      transform: getTransformStream(),
      progress: report,
      concurrency: 10,
    };
    await copyTileset(sourceTileset, transformedTileset, options);
    console.log("Transform finished.");
  } catch (error) {
    console.log(error);
  }
}

async function deleteTileset(path) {
  console.log(`Deleting ${path}...`);
  await unlink(path);
  console.log(`Deleted ${path}.`);
}

async function main() {
  try {
    if (process.env.TILESETS) {
      const tilesets = Object.values(JSON.parse(process.env.TILESETS));
      for (let tileset of tilesets) {
        if (tileset.filename) {
          let directory = "/data/";
          if (process.env.ENV === "local") {
            directory = "./data/";
          }
          if (tileset.transform) {
            directory = "./transform/";
            await rmdir(directory, { recursive: true });
          }
          const tilesetPath = path.join(directory, tileset.filename);
          if (tileset.download && tileset.url) {
            await downloadTileset(tileset.url, tilesetPath, tileset.size);
          }

          if (tileset.transform) {
            await transformTileset(tilesetPath);
            let destinationPath = `/data/${tileset.filename}`;
            if (process.env.ENV === "local") {
              destinationPath = `./data/${tileset.filename}`;
            }
            await move(`./${tilesetPath}-transformed`, destinationPath);
            await rmdir(directory, { recursive: true });
          }
          if (
            !tileset.download &&
            tileset.delete &&
            fs.existsSync(tilesetPath)
          ) {
            await deleteTileset(tilesetPath);
          }
        }
      }
    }

    // Keep node process running forever
    setInterval(() => {}, 1 << 30);
  } catch (error) {
    console.log(error);
  }
}

main();
