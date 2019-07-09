export default class MinimapControl {
  constructor(options) {
    this._markup = options.minimapMarkup;
  }
  onAdd(map) {
    this._map = map;
    this._container = document.createElement("div");
    this._container.className = "mapboxgl-ctrl";
    this._container.innerHTML = this._markup;
    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}
