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

  getDefaultGeojsonStyles() {
    return {
      line: {
        stroke: "#c31906",
        "stroke-width": 2,
        "stroke-opacity": 1
      },
      polygon: {
        "stroke-width": 0,
        fill: "#c31906",
        "fill-opacity": 0.35
      }
    };
  }

  getPointStyleProperties(geojsonProperties) {
    const verticalOffset = 0.6;
    const horizontalOffset = 0.8;
    const properties = {
      textField: "{label}",
      textAnchor: "bottom",
      textJustify: "center",
      textOffset: [0, -verticalOffset],
      textSize: 14,
      textColor: "#05032d",
      textHaloColor: "#ffffff",
      textHaloWidth: 2,
      textFont: ["GT America Standard Medium"],
      iconImage: "point-10",
      iconSize: 1
    };

    if (geojsonProperties.labelPosition === "top") {
      if (geojsonProperties.type === "event") {
        properties.textField = "{label} \n \u2193";
      }
    } else if (geojsonProperties.labelPosition === "bottom") {
      properties.textAnchor = "top";
      properties.textOffset = [0, verticalOffset];
      if (geojsonProperties.type === "event") {
        properties.textField = "\u2191 \n {label}";
      }
    } else if (geojsonProperties.labelPosition === "left") {
      properties.textAnchor = "right";
      properties.textOffset = [-horizontalOffset, 0];
      properties.textJustify = "right";
      if (geojsonProperties.type === "event") {
        properties.textField = "{label} \u2192";
      }
    } else if (geojsonProperties.labelPosition === "right") {
      properties.textAnchor = "left";
      properties.textOffset = [horizontalOffset, 0];
      properties.textJustify = "left";
      if (geojsonProperties.type === "event") {
        properties.textField = "\u2190 {label}";
      }
    } else if (geojsonProperties.labelPosition === "topleft") {
      properties.textAnchor = "bottom-right";
      properties.textOffset = [-horizontalOffset / 2, -verticalOffset / 2];
      properties.textJustify = "right";
      if (geojsonProperties.type === "event") {
        properties.textField = "{label} \n \u2198";
      }
    } else if (geojsonProperties.labelPosition === "topright") {
      properties.textAnchor = "bottom-left";
      properties.textOffset = [horizontalOffset / 2, -verticalOffset / 2];
      properties.textJustify = "left";
      if (geojsonProperties.type === "event") {
        properties.textField = "{label} \n \u2199";
      }
    } else if (geojsonProperties.labelPosition === "bottomleft") {
      properties.textAnchor = "top-right";
      properties.textOffset = [-horizontalOffset / 2, verticalOffset / 2];
      properties.textJustify = "right";
      if (geojsonProperties.type === "event") {
        properties.textField = "{label} \u2197";
      }
    } else if (geojsonProperties.labelPosition === "bottomright") {
      properties.textAnchor = "top-left";
      properties.textOffset = [horizontalOffset / 2, verticalOffset / 2];
      properties.textJustify = "left";
      if (geojsonProperties.type === "event") {
        properties.textField = "\u2196 {label}";
      }
    }

    if (geojsonProperties.type === "pointLightLabel") {
      properties.textSize = 12;
      properties.iconSize = 0.9;
    } else if (geojsonProperties.type === "pointOnly") {
      properties.textField = "";
    } else if (geojsonProperties.type === "label") {
      properties.iconImage = "";
      properties.textAnchor = "center";
      properties.textOffset = [0, 0];
      properties.textJustify = "center";
      properties.textFont = ["GT America Standard Light"];
    } else if (geojsonProperties.type === "epicenter") {
      properties.iconImage = "epicenter-42";
      properties.textField = "";
      properties.iconSize = 1;
    }

    return properties;
  }

  addFeatures() {
    const defaultGeojsonStyles = this.getDefaultGeojsonStyles();
    const style = this.map.getStyle();
    const allSymbolIndices = style.layers.reduce((ascending, layer, index) => {
      if (layer.type === "symbol") {
        ascending.push(layer.id);
      }
      return ascending;
    }, []);
    const layerId = allSymbolIndices[1] || style.layers.pop().id;
    for (const [
      i,
      geojson
    ] of this.data.mapConfig.features.polygons.entries()) {
      this.map.addLayer(
        {
          id: `polygon-${i}`,
          type: "fill",
          source: {
            type: "geojson",
            data: geojson
          },
          paint: {
            "fill-color": [
              "string",
              ["get", "fill"],
              defaultGeojsonStyles.polygon.fill
            ],
            "fill-opacity": [
              "number",
              ["get", "fill-opacity"],
              defaultGeojsonStyles.polygon["fill-opacity"]
            ]
          }
        },
        layerId
      );

      this.map.addLayer(
        {
          id: `polygon-outline-${i}`,
          type: "line",
          source: {
            type: "geojson",
            data: geojson
          },
          paint: {
            "line-color": [
              "string",
              ["get", "stroke"],
              defaultGeojsonStyles.line["stroke"]
            ],
            "line-width": [
              "number",
              ["get", "stroke-width"],
              defaultGeojsonStyles.polygon["stroke-width"]
            ],
            "line-opacity": [
              "number",
              ["get", "stroke-opacity"],
              defaultGeojsonStyles.line["stroke-opacity"]
            ]
          }
        },
        layerId
      );
    }

    for (const [
      i,
      geojson
    ] of this.data.mapConfig.features.linestrings.entries()) {
      this.map.addLayer(
        {
          id: `linestring-${i}`,
          type: "line",
          source: {
            type: "geojson",
            data: geojson
          },
          paint: {
            "line-color": [
              "string",
              ["get", "stroke"],
              defaultGeojsonStyles.line["stroke"]
            ],
            "line-width": [
              "number",
              ["get", "stroke-width"],
              defaultGeojsonStyles.line["stroke-width"]
            ],
            "line-opacity": [
              "number",
              ["get", "stroke-opacity"],
              defaultGeojsonStyles.line["stroke-opacity"]
            ]
          },
          layout: {
            "line-cap": "round",
            "line-join": "round"
          }
        },
        layerId
      );
    }

    for (const [i, geojson] of this.data.mapConfig.features.points.entries()) {
      const properties = this.getPointStyleProperties(geojson.properties);
      this.map.addLayer({
        id: `point-${i}`,
        type: "symbol",
        source: {
          type: "geojson",
          data: geojson
        },
        layout: {
          "text-field": properties.textField,
          "text-size": properties.textSize,
          "text-font": properties.textFont,
          "text-anchor": properties.textAnchor,
          "text-justify": properties.textJustify,
          "text-offset": properties.textOffset,
          "icon-image": properties.iconImage,
          "icon-size": properties.iconSize
        },
        paint: {
          "text-color": properties.textColor,
          "text-halo-color": properties.textHaloColor,
          "text-halo-width": properties.textHaloWidth
        }
      });
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
          minimap.options.region !== ""))
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
      const url = `${this.data.toolBaseUrl}/minimap/${minimap.options.type}?region=${minimap.options.region}&bounds=${bounds}&toolBaseUrl=${this.data.toolBaseUrl}`;
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

    if (this.width < 560) {
      this.options.fitBoundsOptions.padding = 30;
    }
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
      this.addFeatures();
      this.preventLabelsAroundViewport();
      this.addControls();
      this.element.parentNode.style.opacity = "1";
      this.onDetached();
    });
  }
}
