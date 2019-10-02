<script>
  export let item;
  export let numberMarkers;
  let numberedLabels = item.geojsonList
    .map(item => {
      if (!item.hasOwnProperty("type")) {
        return undefined;
      }
      if (item.type === "FeatureCollection") {
        return item.features;
      }
      if (item.type === "Feature") {
        return item;
      }
    })
    .reduce((features, value) => {
      if (Array.isArray(value)) {
        features.concat(value);
      } else if (value !== undefined) {
        features.push(value);
      }
      return features;
    }, [])
    .filter(feature => {
      return (
        feature.hasOwnProperty("geometry") &&
        feature.geometry.type === "Point" &&
        feature.properties.hasOwnProperty("label")
      );
    })
    .map((feature, index) => {
      const number = index + 1;
      const numberMarker = numberMarkers.find(numberMarker => {
        return `number-${number}` === numberMarker.id;
      });
      if (numberMarker) {
        return {
          text: feature.properties.label,
          icon: numberMarker.svg
        };
      } else {
        return {
          text: feature.properties.label,
          icon: ""
        };
      }
    })
    .filter(label => {
      return label !== null;
    });
</script>

{#if item.options.labelsBelowMap === true}
  <div
    class="q-locator-map-labels {item.options.labelsBelowMapOneRow === true ? 'q-locator-map-labels--one-row' : ''}">
    {#each numberedLabels as label}
      <div class="q-locator-map-labels__label s-font-note">
        <div class="q-locator-map-labels__icon">
          {@html label.icon}
        </div>
        <div>{label.text}</div>
      </div>
    {/each}
  </div>
{/if}
