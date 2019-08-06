function getAlignLabelClasses(labelPosition) {
  if (labelPosition) {
    return `q-locator-map-marker__label--${labelPosition}`;
  }
  return "q-locator-map-marker__label--top";
}

export default {
  pointHeavyLabel: {
    className: "q-locator-map-marker s-color-gray-1",
    size: 8,
    getMarkup: marker => {
      return `<div class="s-font-note s-font-note--strong q-locator-map-marker__label ${getAlignLabelClasses(
        marker.labelPosition
      )}">${marker.label || ""}</div>`;
    }
  },
  pointLightLabel: {
    className: "q-locator-map-marker s-color-gray-1",
    size: 6,
    getMarkup: marker => {
      return `<div class="s-font-note-s s-font-note--strong q-locator-map-marker__label ${getAlignLabelClasses(
        marker.labelPosition
      )}">${marker.label || ""}</div>`;
    }
  },
  pointOnly: {
    className: "q-locator-map-marker s-color-gray-1",
    size: 8,
    getMarkup: marker => {
      return "";
    }
  },
  label: {
    className: "q-locator-map-marker q-locator-map-marker--without-point",
    size: 0,
    getMarkup: marker => {
      return `<div class="s-font-note s-font-note--strong s-font-note--light q-locator-map-marker__label q-locator-map-marker__label--without-point">${marker.label ||
        ""}</div>`;
    }
  },
  event: {
    className: "q-locator-map-marker s-color-gray-1",
    size: 8,
    getMarkup: marker => {
      return `<div class="s-font-note s-font-note--strong q-locator-map-marker__label ${getAlignLabelClasses(
        marker.labelPosition
      )} q-locator-map-marker__label--event">${marker.label || ""}</div>`;
    }
  },
  epicenter: {
    className: "s-color-gray-9",
    size: 42,
    getMarkup: marker => {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42"><g fill="#B23C39" fill-rule="evenodd"><circle cx="21" cy="21" r="21" fill-opacity=".2"/><circle cx="21" cy="21" r="16" fill-opacity=".2"/><circle cx="21" cy="21" r="11" fill-opacity=".2"/><circle cx="21" cy="21" r="7" fill-opacity=".2"/><circle cx="21" cy="21" r="3"/></g></svg>`;
    }
  }
};
