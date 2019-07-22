<script>
  export let item;
  export let defaultGeojsonStyles;
  let legendItems = getLegendItems(item.geojsonList);

  function getLegendItems(geojsonList) {
    if (!Array.isArray(geojsonList)) {
      return null;
    }
    return geojsonList
      .map(item => {
        // return arrays of features
        if (item.type === "Feature") {
          return [item];
        }
        if (item.type === "FeatureCollection") {
          return item.features;
        }
      })
      .reduce((a, b) => {
        // flatten the features
        return a.concat(b);
      }, [])
      .filter(item => item.geometry && item.geometry.type !== "Point") // keep if not point
      .filter(item => item.properties && item.properties.label) // keep if label is defined
      .filter((currentItem, index, self) => {
        // make unique
        return (
          self.findIndex(item => {
            return (
              item.properties.label === currentItem.properties.label &&
              (item.properties.stroke === currentItem.properties.stroke ||
                item.properties.fill === currentItem.properties.fill)
            );
          }) === index
        );
      })
      .map(item => {
        let opacity;
        let color;
        let type = "default";
        if (
          item.geometry.type === "LineString" ||
          item.geometry.type === "MultiLineString"
        ) {
          if (item.properties["stroke-opacity"]) {
            opacity = item.properties["stroke-opacity"];
          } else {
            opacity = defaultGeojsonStyles.line["stroke-opacity"];
          }
          if (item.properties.stroke) {
            color = item.properties.stroke;
          } else {
            color = defaultGeojsonStyles.line.stroke;
          }
          type = "line";
        } else if (
          item.geometry.type === "Polygon" ||
          item.geometry.type === "MultiPolygon"
        ) {
          if (item.properties["fill-opacity"]) {
            opacity = item.properties["fill-opacity"];
          } else {
            opacity = defaultGeojsonStyles.polygon["fill-opacity"];
          }
          if (item.properties.fill) {
            color = item.properties.fill;
          } else {
            color = defaultGeojsonStyles.polygon.fill;
          }
        }

        return {
          color: color,
          opacity: opacity,
          label: item.properties.label,
          type: type
        };
      });
  }
</script>

{#if item.options.showLegend && legendItems.length > 0}
  <div class="s-legend-icon-label">
    {#each legendItems as legendItem}
      <div class="s-legend-item-label__item">
        <div
          class="s-legend-item-label__item__icon
          s-legend-item-label__item__icon--{legendItem.type}"
          style="color: {legendItem.color}; opacity: {legendItem.opacity};" />
        <div class="s-legend-item-label__item__label">{legendItem.label}</div>
      </div>
    {/each}
  </div>
{/if}
