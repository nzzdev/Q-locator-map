export default class LocatorMap {
  constructor(element, context = {}) {
    this.element = element;
    this.context = JSON.parse(context);
    this.render();
  }

  render() {
    mapboxgl.accessToken =
      "pk.eyJ1IjoibWFudWVscm90aCIsImEiOiJQUFk4RmtvIn0.sxUONBlaOlyYSR3XMJ3uJg";
    const mapConfig = {
      container: this.element,
      style: "mapbox://styles/mapbox/streets-v11",
      interactive: false
    };
    if (this.context.bounds) {
      mapConfig.bounds = new mapboxgl.LngLatBounds(this.context.bounds);
    } else {
      mapConfig.center = this.context.center;
      const initialZoomLevel = this.context.item.options.initialZoomLevel;
      if (this.context.item.options.initialZoomLevel !== -1) {
        mapConfig.zoom = initialZoomLevel;
      } else {
        mapConfig.zoom = 9;
      }
    }

    const map = new mapboxgl.Map(mapConfig);
    if (this.context.bounds) {
      map.fitBounds(mapConfig.bounds, { padding: 100 });
    }
    map.on("load", () => {
      const firstSymbolLayer = map
        .getStyle()
        .layers.find(layer => layer.type === "symbol");
      for (const [i, geojson] of this.context.item.geojsonList.entries()) {
        map.addSource(`source-${i}`, {
          type: "geojson",
          data: geojson
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
            "text-halo-width": 4
          },
          filter: ["==", "$type", "Point"]
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
          id: "linestring-${i}",
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
          filter: ["==", "$type", "LineString"]
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
      }
    });
  }
}
