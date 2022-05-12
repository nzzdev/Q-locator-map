<script>
  import AnnotationPoint from "./AnnotationPoint.svelte";

  export let item;
  export let annotationRadius = 8;

  let x = "50%";
  let y = "50%";

  let numberedLabels = item.geojsonList
    .map((item) => {
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
    .filter((feature) => {
      return (
        feature.hasOwnProperty("geometry") &&
        feature.geometry.type === "Point" &&
        feature.properties.hasOwnProperty("label") &&
        !["country", "capital", "city", "water", "label"].includes(
          feature.properties.type
        )
      );
    })
    .map((feature, index) => ({
      id: index + 1,
      text: feature.properties.label,
    }))
    .filter((label) => {
      return label !== null;
    });
</script>

{#if item.options.labelsBelowMap === true}
  <div
    class="s-q-item__annotation-legend s-font-note {item.options.labelsBelowMapOneRow === true
      ? 'q-locator-map-labels--one-row'
      : ''}"
    style="{item.options.labelsBelowMapOneRow === true
      ? 'flex-flow: row wrap;'
      : ''}">
    {#each numberedLabels as { id, text }}
      <div class="s-q-item__annotation-legend__item">
        <div class="s-q-item__annotation-legend__item__icon">
          <svg width="1.4em" height="1.4em">
            <AnnotationPoint {id} radius={annotationRadius} {x} {y} />
          </svg>
        </div>
        <div class="s-q-item__annotation-legend__item__label">{text}</div>
      </div>
    {/each}
  </div>
{/if}
