const Boom = require("@hapi/boom");
const fetch = require("node-fetch");
const vtpbf = require("vt-pbf");
const geojsonvt = require("geojson-vt");
const zlib = require("zlib");
const db = require("./db.js");

function getValidGeodataUrl(geodataEntry, version) {
  if (version >= 0 && geodataEntry.versions[version]) {
    return geodataEntry.versions[version].format.geojson;
  } else {
    const entry = geodataEntry.versions.pop();
    return entry.format.geojson;
  }
}

async function getGeodataGeojson(id, version) {
  try {
    const response = await db.get(id);
    const geodataEntry = response.docs.pop();
    if (geodataEntry) {
      const geodataUrl = getValidGeodataUrl(geodataEntry, version);
      const response = await fetch(geodataUrl);
      if (response.ok) {
        return await response.json();
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

async function getGeodataTile(id, z, x, y, version) {
  try {
    const geodata = await this.server.methods.getGeodataGeojson(id, version);
    const tileIndex = geojsonvt(geodata);
    const tile = tileIndex.getTile(z, x, y);
    if (tile) {
      const tileObject = {};
      tileObject[`source-${id}`] = tile;
      return zlib.gzipSync(vtpbf.fromGeojsonVt(tileObject, { version: 2 }));
    } else {
      return Boom.notFound();
    }
  } catch (error) {
    return Boom.notFound();
  }
}

module.exports = {
  getGeodataGeojson: getGeodataGeojson,
  getGeodataTile: getGeodataTile
};
