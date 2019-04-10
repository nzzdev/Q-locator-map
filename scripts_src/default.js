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
      style: "mapbox://styles/mapbox/streets-v11"
    };
    if (this.context.bounds) {
      mapConfig.bounds = new mapboxgl.LngLatBounds(this.context.bounds);
    } else {
      mapConfig.center = this.context.center;
      mapConfig.zoom = 9;
    }

    const map = new mapboxgl.Map(mapConfig);
    map.on("load", () => {
      for (let i = 0; i < this.context.item.geojsonList; i++) {
        const geojson = this.context.item.geojsonList[i];
        map.addLayer({
          id: `overlay-${i}`,
          type: "symbol",
          source: {
            type: "geojson",
            data: geojson
          },
          layout: {
            "text-field": "{label}",
            "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
            "text-offset": [0, 0.6],
            "text-anchor": "top"
          }
        });
      }
    });
  }
}
