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
      style: this.context.mapConfig.nzz_ch.styles[
        this.context.item.options.baseLayer
      ].style,
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
    if (this.context.mapConfig.bounds && initialZoomLevel === -1) {
      map.fitBounds(mapConfig.bounds, { padding: 100, duration: 0 });
    }
  }
}
