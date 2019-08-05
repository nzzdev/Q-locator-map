const zlib = require("zlib");
const Boom = require("@hapi/boom");
const mbtiles = require("@mapbox/mbtiles");
const vtpbf = require("vt-pbf");
const geojsonvt = require("geojson-vt");

function getTileset(path) {
  const tilesetPath = `${path}?mode=ro`;
  return new Promise(function(resolve, reject) {
    new mbtiles(tilesetPath, function(err, tileset) {
      if (err) {
        reject(err);
      } else {
        resolve(tileset);
      }
    });
  });
}

async function getTile(tileset, z, x, y) {
  return await new Promise((resolve, reject) => {
    this.tilesets[tileset].getTile(z, x, y, (error, tile) => {
      if (error) {
        reject(Boom.notFound());
      } else {
        resolve(tile);
      }
    });
  });
}

async function getTilesetTile(item, id, z, x, y) {
  try {
    if (id >= 0 && id < item.geojsonList.length) {
      const tileIndex = geojsonvt(item.geojsonList[id]);
      const tile = tileIndex.getTile(z, x, y);
      if (tile) {
        const tileObject = {};
        tileObject[`source-${id}`] = tile;
        return zlib.gzipSync(vtpbf.fromGeojsonVt(tileObject, { version: 2 }));
      } else {
        return Boom.notFound();
      }
    } else {
      return Boom.notFound();
    }
  } catch (error) {
    return Boom.notFound();
  }
}

module.exports = {
  getTileset: getTileset,
  getTile: getTile,
  getTilesetTile: getTilesetTile
};
