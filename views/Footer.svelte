<script>
  export let item;
  let hasSource = item.sources && item.sources.length > 0;
  let hasNotes = item.notes && item.notes != "";
  let hasGeojsonFeatures = item.geojsonList.some(geojson => {
    if (geojson.type === "Feature") {
      return geojson.geometry.type !== "Point";
    }
    return true;
  });
  let showAcronym =
    item.acronym && (hasSource || hasNotes || hasGeojsonFeatures);

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
      let codePoint = null;
      if (index < 20) {
        codePoint = 9312 + index;
      } else if (index >= 20 && index < 36) {
        codePoint = 12881 + index;
      } else if (index >= 36 && index < 50) {
        codePoint = 12977 + index;
      }
      if (codePoint) {
        return {
          codePoint: String.fromCodePoint(codePoint),
          text: feature.properties.label.replace(/<br>/g, " ")
        };
      }
      return null;
    })
    .filter(label => {
      return label !== null;
    });
</script>

<div class="s-q-item__footer">
  {#if item.options.labelsBelowMap === true}
    <div
      class="q-locator-map-footer__marker-labels {item.options.labelsBelowMapOneRow === true ? 'q-locator-map-footer__marker-labels--one-row' : ''}">
      {#each numberedLabels as label}
        <div class="q-locator-map-footer__marker-labels__label s-font-note">
          <span class="q-locator-map-code-point">{label.codePoint}</span>
          {label.text}
        </div>
      {/each}
    </div>
  {/if}
  {#if hasNotes}{item.notes}{/if}
  {#if hasSource}
    {#if hasNotes}&nbsp;&ndash;&nbsp;{/if}
    {#if item.sources.length > 1}Quellen:{:else}Quelle:{/if}
    {#each item.sources as source, index}
      {#if source.text !== ''}
        {#if source.link && source.link.url && source.link.isValid}
          <a href={source.link.url} target="blank" rel="noopener noreferrer">
            {source.text}
          </a>
        {:else}{source.text}{/if}
        {#if index !== item.sources.length - 1 && item.sources[index + 1] !== ''}
          ,&nbsp;
        {/if}
      {/if}
    {/each}
  {/if}
  {#if showAcronym}
    {#if hasNotes || hasSource}&nbsp;&ndash;&nbsp;{/if}
    Grafik: {item.acronym}
  {/if}
</div>
