import mapboxgl from "mapbox-gl";
import * as helpers from "./helpers.js";
import MinimapControl from "./minimap.js";
export default class LocatorMap {
  constructor(element, data = {}) {
    if (element) {
      this.element = element;
      this.data = data;
      this.width =
        this.data.width || this.element.getBoundingClientRect().width;
      this.setHeight();
      helpers.getStyle(this.data).then(style => {
        this.data.config.style = style;
        this.render();
      });
    }
  }

  setHeight() {
    if (this.data.config.aspectRatio) {
      this.element.style.height = `${this.width *
        this.data.config.aspectRatio}px`;
    } else {
      const aspectRatio = this.width > 450 ? 9 / 16 : 1;
      this.element.style.height = `${this.width * aspectRatio}px`;
    }
  }

  addControls() {
    let attributionPosition = "bottom-right";
    const minimap = this.data.options.minimap;
    if (
      minimap.showMinimap &&
      (minimap.options.type === "globe" ||
        (minimap.options.type === "region" &&
          minimap.options.region &&
          minimap.options.region.id &&
          minimap.options.region.id !== ""))
    ) {
      if (minimap.options.position === "bottom-right") {
        attributionPosition = "bottom-left";
      }
      let bounds = this.map.getBounds().toArray();
      bounds = JSON.stringify([
        bounds[0][0],
        bounds[0][1],
        bounds[1][0],
        bounds[1][1]
      ]);
      let url = `${this.data.toolBaseUrl}/minimap/${minimap.options.type}?bounds=${bounds}&toolBaseUrl=${this.data.toolBaseUrl}`;
      if (
        minimap.options.region &&
        minimap.options.region.id &&
        minimap.options.region.id !== ""
      ) {
        url = `${url}&regionId=${minimap.options.region.id}`;
      }
      if (
        minimap.options.region &&
        minimap.options.region.label &&
        minimap.options.region.label !== ""
      ) {
        url = `${url}&regionLabel=${minimap.options.region.label}`;
      }
      fetch(url)
        .then(response => {
          if (response.ok) {
            return response.json();
          }
        })
        .then(result => {
          this.map.addControl(
            new MinimapControl({
              minimapMarkup: result.markup
            }),
            minimap.options.position
          );
        });
    }

    if (this.data.options.baseLayer.style !== "satellite") {
      this.map.addControl(
        new mapboxgl.AttributionControl(),
        attributionPosition
      );
    }
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
      style: this.data.config.style,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      fitBoundsOptions: { padding: 60, duration: 0 }
    };

    if (this.data.config.zoom) {
      this.options.fitBoundsOptions.maxZoom = this.data.config.zoom;
    }
    if (this.data.config.bbox) {
      this.options.bounds = new mapboxgl.LngLatBounds(this.data.config.bbox);
      this.options.fitBoundsOptions.padding = 0;
    } else if (this.data.config.bounds) {
      this.options.bounds = new mapboxgl.LngLatBounds(this.data.config.bounds);
    } else {
      this.options.center = this.data.config.center;
      this.options.zoom = this.data.config.zoom;
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
