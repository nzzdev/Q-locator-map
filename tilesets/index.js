const fs = require("fs-extra");
const util = require("util");
const progress = require("progress-stream");
const fetch = require("node-fetch");
const unlink = util.promisify(fs.unlink);
const path = require("path");
const directory = process.env.ENV === "local" ? "./data/" : "/data/";

async function downloadTileset(url, path, size) {
  console.log(`Downloading ${url} to ${path}...`);
  await fs.ensureFile(path);

  const response = await fetch(url);
  if (response.ok) {
    const progressStream = progress({
      length: size,
      time: 1000 /* ms */,
    });
    progressStream.on("progress", (progress) => {
      console.log(`Progress: ${Math.round(progress.percentage * 10) / 10} %\r`);
    });
    response.body
      .pipe(progressStream)
      .pipe(fs.createWriteStream(path))
      .on("error", console.error)
      .on("finish", () =>
        console.log(`Download finished. Saved ${url} to ${path}.`)
      );
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
      const tilesets = JSON.parse(process.env.TILESETS);
      for (let tileset of Object.values(tilesets)) {
        if (tileset.filename) {
          const tilesetPath = path.join(directory, tileset.filename);
          // Container is mounted to NFS share if directory /data/.snapshot exists
          const isNFSMount = fs.existsSync(path.join(directory, ".snapshot"));
          if (
            tileset.download &&
            tileset.url &&
            (isNFSMount || process.env.ENV === "local")
          ) {
            await downloadTileset(tileset.url, tilesetPath, tileset.size);
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
