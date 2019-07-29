import MinimapControl from "./minimap.js";

export default class LocatorMap {
  constructor(element, data = {}) {
    if (element) {
      this.element = element;
      this.data = data;
      this.width =
        this.data.width || this.element.getBoundingClientRect().width;
      this.setHeight();
      this.render();
    }
  }

  setHeight() {
    const aspectRatio = this.width > 450 ? 9 / 16 : 1;
    this.element.style.height = `${this.width * aspectRatio}px`;
  }

  render() {
    const mapConfig = {
      container: this.element,
      style: this.data.mapConfig.styleUrl,
      interactive: false,
      attributionControl: false
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
    const minimapOptions = this.data.options.minimapOptions || {};
    if (
      (this.data.options.minimap && minimapOptions.type === "globe") ||
      (this.data.options.minimap &&
        minimapOptions.type === "region" &&
        minimapOptions.region)
    ) {
      map.addControl(
        new MinimapControl({
          minimapMarkup: this.data.mapConfig.minimapMarkup
        }),
        minimapOptions.position
      );
    }

    let attributionPosition;
    if (minimapOptions.position === "bottom-right") {
      attributionPosition = "bottom-left";
    } else {
      attributionPosition = "bottom-right";
    }
    map.addControl(new mapboxgl.AttributionControl(), attributionPosition);

    if (this.data.mapConfig.bounds && initialZoomLevel === -1) {
      map.fitBounds(mapConfig.bounds, { padding: 60, duration: 0 });
    }

    // Clean up and release all resources associated with the map as soon as the map gets removed from DOM
    const observer = new MutationObserver((mutationList, observer) => {
      for (let mutation of mutationList) {
        if (mutation.removedNodes.length > 0) {
          map.remove();
          observer.disconnect();
        }
      }
    });
    observer.observe(this.element.parentNode.parentNode, {
      childList: true
    });
  }
}
