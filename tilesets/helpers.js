const transform = require("stream-transform");
const zlib = require("zlib");
const decorator = require("@mapbox/tile-decorator");
const util = require("util");
const mapping = require("./mapping.json");

const labelLayerList = [
  "aerodrom_label",
  "mountain_peak",
  "place",
  "poi",
  "transportation_name",
  "water_name",
  "waterway",
];
const nameAllowlist = ["name:latin", "name:de"];

function getValueIndices(layer, key) {
  const keyIndex = layer.keys.indexOf(key);
  const valueIndices = new Set();

  for (let i = 0; i < layer.features.length; i++) {
    const tags = layer.features[i].tags;
    for (let j = 0; j < tags.length; j += 2) {
      if (tags[j] === keyIndex) {
        const value = layer.values[tags[j + 1]];
        if (value !== undefined) valueIndices.add(tags[j + 1]);
        else throw new Error(key + " not found");
        break;
      }
    }
  }
  return valueIndices;
}

function getValue(layer, key, valueIndex) {
  const currentValue = layer.values[valueIndex];
  if (nameAllowlist.includes(key)) {
    if (mapping.nameMapping[currentValue]) {
      return mapping.nameMapping[currentValue];
    }

    let currentValueCopy = currentValue.slice();
    for (const [key, value] of Object.entries(mapping.replaceMapping)) {
      currentValueCopy = currentValueCopy.replace(new RegExp(key, "gi"), value);
    }
    return currentValueCopy;
  }

  return currentValue;
}

function getChangedValues(layer) {
  layer.keys.forEach((key) => {
    const valueIndices = getValueIndices(layer, key);
    for (let valueIndex of valueIndices.values()) {
      layer.values[valueIndex] = getValue(layer, key, valueIndex);
    }
  });
  return layer.values;
}

function getFilteredTile(tile) {
  tile.layers
    .filter((layer) => {
      return labelLayerList.includes(layer.name);
    })
    .forEach((layer) => {
      const keysToKeep = layer.keys.filter((key) => {
        return (
          !key.startsWith("name") ||
          (key.startsWith("name") && nameAllowlist.includes(key))
        );
      });
      decorator.selectLayerKeys(layer, keysToKeep);
      delete layer.keyLookup;
      delete layer.valLookup;
      layer.values = getChangedValues(layer);
    });
  return tile;
}

function getTransformStream() {
  return transform((data) => {
    const zippedBuffer = data.buffer;
    if (zippedBuffer) {
      const unzippedBuffer = zlib.gunzipSync(zippedBuffer);
      const tile = decorator.read(unzippedBuffer);
      const filteredTile = getFilteredTile(tile);
      data.buffer = zlib.gzipSync(decorator.write(filteredTile));
      return data;
    } else {
      return data;
    }
  });
}

// Used for progress report
function report(stats, p) {
  console.log(
    util.format(
      "\r\033[K[%s] %s%% %s/%s @ %s/s | ✓ %s □ %s | %s left",
      pad(formatDuration(process.uptime()), 4, true),
      pad(p.percentage.toFixed(4), 8, true),
      pad(formatNumber(p.transferred), 6, true),
      pad(formatNumber(p.length), 6, true),
      pad(formatNumber(p.speed), 4, true),
      formatNumber(stats.done - stats.skipped),
      formatNumber(stats.skipped),
      formatDuration(p.eta)
    )
  );
}

function formatDuration(duration) {
  let seconds = duration % 60;
  duration -= seconds;
  let minutes = (duration % 3600) / 60;
  duration -= minutes * 60;
  let hours = (duration % 86400) / 3600;
  duration -= hours * 3600;
  let days = duration / 86400;

  return (
    (days > 0 ? days + "d " : "") +
    (hours > 0 || days > 0 ? hours + "h " : "") +
    (minutes > 0 || hours > 0 || days > 0 ? minutes + "m " : "") +
    seconds +
    "s"
  );
}

function pad(str, len, r) {
  while (str.length < len) str = r ? " " + str : str + " ";
  return str;
}

function formatNumber(num) {
  num = num || 0;
  if (num >= 1e6) {
    return (num / 1e6).toFixed(2) + "m";
  } else if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + "k";
  } else {
    return num.toFixed(0);
  }
}

module.exports = {
  getTransformStream: getTransformStream,
  report: report,
};
