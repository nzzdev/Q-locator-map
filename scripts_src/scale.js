export default class ScaleControl {
  constructor(options) {
    this.options = options;
  }
  onAdd(map) {
    const styleConfig = this.options.config.styleConfig;
    const colors = styleConfig.colors[this.options.config.style.name];
    this._map = map;
    this._container = document.createElement("div");
    this._container.classList.add("mapboxgl-ctrl");
    this._container.classList.add("q-locator-map-scale");
    this._container.style = `
    font-size: ${styleConfig.scale.textSize}px;
    line-height: 1.4em;
    font-family: ${styleConfig.fonts.fontSansRegular.name},nzz-sans-serif,Helvetica,Arial;
    font-weight: 100;
    color: ${styleConfig.scale.textColor};
    border-bottom-width: ${styleConfig.scale.borderWidth}px;
    border-bottom-color: ${styleConfig.scale.textColor};
    text-shadow: -${styleConfig.scale.textHaloWidth}px 0 ${colors.background}, 0 ${styleConfig.scale.textHaloWidth}px ${colors.background}, ${styleConfig.scale.textHaloWidth}px 0 ${colors.background}, 0 -${styleConfig.scale.textHaloWidth}px ${colors.background};`;
    this._container.innerHTML = map.getContainer();

    this._map.on("move", this._onMove);
    this._onMove();

    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map.off("move", this._onMove);
    this._map = undefined;
  }
}

ScaleControl.prototype._onMove = function _onMove() {
  updateScale(this._map, this._container, this.options);
};

ScaleControl.prototype.setUnit = function setUnit(unit) {
  this.options.unit = unit;
  updateScale(this._map, this._container, this.options);
};

function updateScale(map, container, options) {
  if (map !== undefined && container !== undefined) {
    // A horizontal scale is imagined to be present at center of the map
    // container with maximum length (Default) as 100px.
    // Using spherical law of cosines approximation, the real distance is
    // found between the two coordinates.
    let maxWidth = (options && options.maxWidth) || 100;

    let y = map._container.clientHeight / 2;
    let maxMeters = getDistance(
      map.unproject([0, y]),
      map.unproject([maxWidth, y])
    );
    // The real distance corresponding to 100px scale length is rounded off to
    // near pretty number and the scale length for the same is found out.
    // Default unit of the scale is based on User's locale.
    if (options && options.unit === "imperial") {
      let maxFeet = 3.2808 * maxMeters;
      if (maxFeet > 5280) {
        let maxMiles = maxFeet / 5280;
        setScale(container, maxWidth, maxMiles, "mi");
      } else {
        setScale(container, maxWidth, maxFeet, "ft");
      }
    } else if (options && options.unit === "nautical") {
      let maxNauticals = maxMeters / 1852;
      setScale(container, maxWidth, maxNauticals, "nm");
    } else {
      setScale(container, maxWidth, maxMeters, "m");
    }
  }
}

function setScale(container, maxWidth, maxDistance, unit) {
  let distance = getRoundNum(maxDistance);
  let ratio = distance / maxDistance;
  let shortUnit = "";

  if (unit === "m" && distance >= 1000) {
    distance = distance / 1000;
    unit = " Kilometer";
    shortUnit = " km";
  }

  if (unit === "m") {
    unit = " Meter";
    shortUnit = " m";
  }

  const width = maxWidth * ratio;
  container.style.width = width + "px";
  if (width > 75) {
    container.innerHTML = distance + unit;
  } else {
    container.innerHTML = distance + shortUnit;
  }
}

function getDistance(latlng1, latlng2) {
  // Uses spherical law of cosines approximation.
  let R = 6371000;

  let rad = Math.PI / 180,
    lat1 = latlng1.lat * rad,
    lat2 = latlng2.lat * rad,
    a =
      Math.sin(lat1) * Math.sin(lat2) +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.cos((latlng2.lng - latlng1.lng) * rad);

  let maxMeters = R * Math.acos(Math.min(a, 1));
  return maxMeters;
}

function getDecimalRoundNum(d) {
  let multiplier = Math.pow(10, Math.ceil(-Math.log(d) / Math.LN10));
  return Math.round(d * multiplier) / multiplier;
}

function getRoundNum(num) {
  let pow10 = Math.pow(10, ("" + Math.floor(num)).length - 1);
  let d = num / pow10;

  d =
    d >= 10
      ? 10
      : d >= 5
      ? 5
      : d >= 3
      ? 3
      : d >= 2
      ? 2
      : d >= 1
      ? 1
      : getDecimalRoundNum(d);

  return pow10 * d;
}
