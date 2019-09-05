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

  addControls() {
    let attributionPosition = "bottom-right";
    const minimap = this.data.options.minimap;
    if (minimap.showMinimap && this.data.mapConfig.minimapMarkup) {
      this.map.addControl(
        new MinimapControl({
          minimapMarkup: this.data.mapConfig.minimapMarkup
        }),
        minimap.options.position
      );

      if (minimap.options.position === "bottom-right") {
        attributionPosition = "bottom-left";
      }
    }

    this.map.addControl(new mapboxgl.AttributionControl(), attributionPosition);
  }

  preventLabelsAroundViewport() {
    this.viewport = this.map.getBounds();
    this.map.addSource("viewport-line", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [this.viewport._sw.lng, this.viewport._sw.lat],
            [this.viewport._sw.lng, this.viewport._ne.lat],
            [this.viewport._ne.lng, this.viewport._ne.lat],
            [this.viewport._ne.lng, this.viewport._sw.lat],
            [this.viewport._sw.lng, this.viewport._sw.lat]
          ]
        }
      }
    });

    const width = 5;
    const data = new Uint8Array(width * width * 4);
    this.map.addImage("pixel", { width: width, height: width, data: data });

    this.map.addLayer({
      id: "viewport-line-symbols",
      type: "symbol",
      source: "viewport-line",
      layout: {
        "icon-image": "pixel",
        "symbol-placement": "line",
        "symbol-spacing": 5
      }
    });
  }

  onDetached() {
    // Clean up and release all resources associated with the map as soon as the map gets removed from DOM
    const observer = new MutationObserver((mutationList, observer) => {
      for (let mutation of mutationList) {
        if (mutation.removedNodes.length > 0) {
          this.map.remove();
          observer.disconnect();
        }
      }
    });
    observer.observe(this.element.parentNode.parentNode, {
      childList: true
    });
  }

  render() {
    this.options = {
      container: this.element,
      style: this.data.mapConfig.style,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      fitBoundsOptions: { padding: 60, duration: 0 }
    };

    if (this.data.mapConfig.bbox) {
      this.options.bounds = new mapboxgl.LngLatBounds(this.data.mapConfig.bbox);
    } else if (this.data.mapConfig.bounds) {
      this.options.bounds = new mapboxgl.LngLatBounds(
        this.data.mapConfig.bounds
      );
    } else {
      this.options.center = this.data.mapConfig.center;
      this.options.zoom = this.data.mapConfig.zoom;
    }

    this.map = new mapboxgl.Map(this.options);
    this.map.on("load", () => {
      this.preventLabelsAroundViewport();
      this.addControls();
      this.element.parentNode.style.opacity = "1";
      this.onDetached();
    });
  }
}
