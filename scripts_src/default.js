import MinimapControl from "./minimap.js";

export default class LocatorMap {
  constructor(element, data = {}) {
    this.element = element;
    this.data = data;
    this.width = this.data.width || this.element.getBoundingClientRect().width;
    this.setHeight();
    this.render();
  }

  setHeight() {
    const aspectRatio = this.width > 450 ? 9 / 16 : 1;
    this.element.style.height = `${this.width * aspectRatio}px`;
  }

  render() {
    const mapConfig = {
      container: this.element,
      style: this.data.mapConfig.styleUrl,
      interactive: false
    };
    const initialZoomLevel = this.data.options.initialZoomLevel;
    if (this.data.mapConfig.bounds) {
      if (initialZoomLevel !== -1) {
        mapConfig.zoom = initialZoomLevel;
        mapConfig.center = this.data.mapConfig.center;
      } else {
        mapConfig.bounds = new mapboxgl.LngLatBounds(
          this.data.mapConfig.bounds
        );
      }
    } else {
      mapConfig.center = this.data.mapConfig.center;
      if (initialZoomLevel !== -1) {
        mapConfig.zoom = initialZoomLevel;
      } else {
        mapConfig.zoom = 9;
      }
    }

    const map = new mapboxgl.Map(mapConfig);
    if (this.data.options.minimap) {
      const minimapOptions = this.data.options.minimapOptions || {};
      const position = minimapOptions.position || "bottom-right";
      map.addControl(
        new MinimapControl({
          minimapMarkup: this.data.mapConfig.minimapMarkup
        }),
        position
      );
    }

    if (this.data.mapConfig.bounds && initialZoomLevel === -1) {
      map.fitBounds(mapConfig.bounds, { padding: 60, duration: 0 });
    }
  }
}
