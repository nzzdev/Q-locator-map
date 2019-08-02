module.exports.migrate = function(item) {
  let result = {
    isChanged: false
  };
  if (item.options && typeof item.options.baseLayer === "string") {
    if (item.options.baseLayer === "") {
      item.options.baseLayer = {};
    } else {
      let style;
      if (["terrain", "terrainNoLabels"].includes(item.options.baseLayer)) {
        style = "nature";
      } else if (["aerial"].includes(item.options.baseLayer)) {
        style = "satellite";
      } else {
        style = "basic";
      }
      item.options.baseLayer = {
        style: style,
        layers: {
          label: true
        }
      };
    }
    result.isChanged = true;
  }

  if (item.options && typeof item.options.minimap === "boolean") {
    item.options.minimap = {
      showMinimap: item.options.minimap,
      options: {
        type: "globe"
      }
    };

    result.isChanged = true;
  }

  if (item.options && Number.isInteger(item.options.minimapInitialZoomOffset)) {
    delete item.options.minimapInitialZoomOffset;
    result.isChanged = true;
  }

  if (item.options && Number.isInteger(item.options.initialZoomLevel)) {
    delete item.options.initialZoomLevel;
    result.isChanged = true;
  }

  result.item = item;
  return result;
};
