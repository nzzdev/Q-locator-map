import mapboxgl from "mapbox-gl";
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
    if (this.data.mapConfig.aspectRatio) {
      this.element.style.height = `${this.width *
        this.data.mapConfig.aspectRatio}px`;
    } else {
      const aspectRatio = this.width > 450 ? 9 / 16 : 1;
      this.element.style.height = `${this.width * aspectRatio}px`;
    }
  }

  render() {
    const mapConfig = {
      container: this.element,
      style: this.data.mapConfig.style,
      interactive: false,
      attributionControl: false
    };

    if (this.data.mapConfig.bbox) {
      mapConfig.bounds = new mapboxgl.LngLatBounds(this.data.mapConfig.bbox);
    } else if (this.data.mapConfig.bounds) {
      mapConfig.bounds = new mapboxgl.LngLatBounds(this.data.mapConfig.bounds);
    } else {
      mapConfig.center = this.data.mapConfig.center;
      mapConfig.zoom = this.data.mapConfig.zoom;
    }

    const map = new mapboxgl.Map(mapConfig);
    map.on("load", () => {
      let attributionPosition = "bottom-right";
      const minimap = this.data.options.minimap;
      if (minimap.showMinimap) {
        map.addControl(
          new MinimapControl({
            minimapMarkup: this.data.mapConfig.minimapMarkup
          }),
          minimap.options.position
        );

        if (minimap.options.position === "bottom-right") {
          attributionPosition = "bottom-left";
        }
      }

      map.addControl(new mapboxgl.AttributionControl(), attributionPosition);
      if (this.data.mapConfig.bounds) {
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
      this.element.parentNode.style.opacity = "1";
    });
  }
}
