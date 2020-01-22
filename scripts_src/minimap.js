export default class MinimapControl {
  constructor(options) {
    this.options = options;
  }
  onAdd(map) {
    this._map = map;
    this._container = document.createElement("div");
    this._container.classList.add("mapboxgl-ctrl");
    this._container.classList.add("q-locator-map-minimap");
    if (this.options.styleConfig.hasShadow) {
      this._container.style =
        "filter: drop-shadow(8px 8px 10px rgba(0, 0, 0, 0.2));";
    }
    this._container.innerHTML = this.options.markup;
    return this._container;
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}
