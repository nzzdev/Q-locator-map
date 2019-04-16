export default class LocatorMap {
  constructor(element, context = {}) {
    this.element = element;
    this.context = JSON.parse(context);
    this.width =
      this.context.width || this.element.getBoundingClientRect().width;
    this.setHeight();
    this.render();
  }

  setHeight() {
    const aspectRatio = this.width > 450 ? 9 / 16 : 1;
    this.element.style.height = `${this.width * aspectRatio}px`;
  }

  render() {
    mapboxgl.accessToken = this.context.mapConfig.nzz_ch.accessToken;
    const mapConfig = {
      container: this.element,
      style: this.context.mapConfig.nzz_ch[this.context.item.options.baseLayer]
        .style,
      interactive: false
    };
    const initialZoomLevel = this.context.item.options.initialZoomLevel;
    if (this.context.mapConfig.bounds) {
      if (initialZoomLevel !== -1) {
        mapConfig.zoom = initialZoomLevel;
        mapConfig.center = this.context.mapConfig.center;
      } else {
        mapConfig.bounds = new mapboxgl.LngLatBounds(
          this.context.mapConfig.bounds
        );
      }
    } else {
      mapConfig.center = this.context.mapConfig.center;
      if (initialZoomLevel !== -1) {
        mapConfig.zoom = initialZoomLevel;
      } else {
        mapConfig.zoom = 9;
      }
    }

    const map = new mapboxgl.Map(mapConfig);
    if (this.context.mapConfig.bounds) {
      map.fitBounds(mapConfig.bounds, { padding: 100 });
    }
    map.on("load", () => {
      const firstSymbolLayer =
        map.getStyle().layers.find(layer => layer.type === "symbol") || {};
      for (const [i, geojson] of this.context.item.geojsonList.entries()) {
        map.addSource(`source-${i}`, {
          type: "geojson",
          data: geojson
        });

        map.addLayer(
          {
            id: `polygon-${i}`,
            type: "fill",
            source: `source-${i}`,
            paint: {
              "fill-color": ["string", ["get", "fill"], "#c31906"],
              "fill-opacity": ["number", ["get", "fill-opacity"], 0.35]
            },
            filter: ["==", "$type", "Polygon"]
          },
          firstSymbolLayer.id
        );

        map.addLayer(
          {
            id: `polygon-outline-${i}`,
            type: "line",
            source: `source-${i}`,
            paint: {
              "line-color": ["string", ["get", "stroke"], "#c31906"],
              "line-width": ["number", ["get", "stroke-width"], 0],
              "line-opacity": ["number", ["get", "stroke-opacity"], 1]
            },
            filter: ["==", "$type", "Polygon"]
          },
          firstSymbolLayer.id
        );

        map.addLayer({
          id: `linestring-${i}`,
          type: "line",
          source: {
            type: "geojson",
            data: geojson
          },
          paint: {
            "line-color": ["string", ["get", "stroke"], "#c31906"],
            "line-width": ["number", ["get", "stroke-width"], 2],
            "line-opacity": ["number", ["get", "stroke-opacity"], 1]
          },
          layout: {
            "line-cap": "round",
            "line-join": "round"
          },
          filter: ["==", "$type", "LineString"]
        });

        map.addLayer({
          id: `point-${i}`,
          type: "circle",
          source: `source-${i}`,
          paint: {
            "circle-radius": 5,
            "circle-color": "#000000",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff"
          },
          filter: ["==", "$type", "Point"]
        });

        map.addLayer({
          id: `label-${i}`,
          type: "symbol",
          source: `source-${i}`,
          layout: {
            "text-field": "{label}",
            "text-size": 13,
            "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
            "text-line-height": 1.1,
            "text-offset": [0, -2],
            "text-anchor": ["string", ["get", "labelPosition"], "center"]
          },
          paint: {
            "text-halo-color": "#ffffff",
            "text-halo-width": 4,
            "text-halo-blur": 4
          },
          filter: ["==", "$type", "Point"]
        });
      }
    });
  }
}
