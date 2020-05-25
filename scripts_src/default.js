import mapboxgl from "mapbox-gl";
import * as helpers from "./helpers.js";
import MinimapControl from "./minimap.js";
import ScaleControl from "./scale.js";
export default class LocatorMap {
  constructor(element, data = {}) {
    if (element) {
      this.element = element;
      this.data = data;
      this.width =
        this.data.width || this.element.getBoundingClientRect().width;
      this.setHeight();
      this.createIntersectionObserver();
    }
  }

  createIntersectionObserver() {
    if (typeof IntersectionObserver !== "undefined") {
      let observer;
      const top = 100;
      const bottom = 100;
      const left = 0;
      const right = 0;
      const options = {
        rootMargin: `${top}% ${right}% ${bottom}% ${left}%`,
      };

      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const inViewport = entry.isIntersecting;
          if (inViewport && this.map === undefined) {
            // Initialize map if it is within the viewport
            console.log("Is after scroll in viewport");
            this.init();
          } else if (!inViewport && this.map !== undefined) {
            console.log("Was removed after left viewport");
            // Release all resources associated with the map as soon as the map is out of the viewport
            this.map.remove();
            delete this.map;
          }
        });
      }, options);
      observer.observe(this.element);
    }
  }

  setHeight() {
    if (this.data.config.aspectRatio) {
      this.element.style.height = `${
        this.width * this.data.config.aspectRatio
      }px`;
    } else {
      const aspectRatio =
        this.width > this.data.config.styleConfig.aspectRatioBreakpoint
          ? 9 / 16
          : 1;
      this.element.style.height = `${this.width * aspectRatio}px`;
    }
  }

  addControls() {
    const minimap = this.data.options.minimap;
    if (this.data.options.baseLayer.style !== "satellite") {
      let scalePosition =
        minimap.showMinimap &&
        minimap.options &&
        minimap.options.position === "bottom-left"
          ? "top-left"
          : "bottom-left";
      this.map.addControl(
        new ScaleControl({ maxWidth: 120, config: this.data.config }),
        scalePosition
      );
    }
    if (
      minimap.showMinimap &&
      (minimap.options.type === "globe" ||
        (minimap.options.type === "region" &&
          minimap.options.region &&
          minimap.options.region.id &&
          minimap.options.region.id !== ""))
    ) {
      let styleConfig = this.data.config.styleConfig.minimap;
      styleConfig.textFont = this.data.config.styleConfig.fonts.fontSansRegular.name;

      let url = `${this.data.config.toolBaseUrl}/minimap/${
        minimap.options.type
      }?bounds=${JSON.stringify(
        helpers.getBounds(this.map)
      )}&styleConfig=${encodeURIComponent(
        JSON.stringify(styleConfig)
      )}&toolBaseUrl=${this.data.config.toolBaseUrl}`;
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
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
        })
        .then((result) => {
          const options = {
            markup: result.markup,
            styleConfig: styleConfig,
          };
          this.map.addControl(
            new MinimapControl(options),
            minimap.options.position
          );
        });
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
            [this.viewport._sw.lng, this.viewport._sw.lat],
          ],
        },
      },
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
        "symbol-spacing": 5,
      },
    });
  }

  init() {
    helpers.getStyle(this.data).then((style) => {
      this.data.config.style = style;

      this.options = {
        container: this.element,
        style: this.data.config.style,
        interactive: false,
        attributionControl: false,
        fadeDuration: 0,
        fitBoundsOptions: { padding: 60, duration: 0 },
      };

      if (this.data.config.zoom) {
        this.options.fitBoundsOptions.maxZoom = this.data.config.zoom;
      }
      if (this.data.config.bbox) {
        this.options.bounds = new mapboxgl.LngLatBounds(this.data.config.bbox);
        this.options.fitBoundsOptions.padding = 0;
      } else if (this.data.config.bounds) {
        this.options.bounds = new mapboxgl.LngLatBounds(
          this.data.config.bounds
        );
      } else {
        this.options.center = this.data.config.center;
        this.options.zoom = this.data.config.zoom;
      }

      this.map = new mapboxgl.Map(this.options);
      this.map.on("load", () => {
        this.preventLabelsAroundViewport();
        this.addControls();
        helpers.hightlightCountryLabels(this.map, this.data);
        this.element.parentNode.style.opacity = "1";
      });
    });
  }
}
