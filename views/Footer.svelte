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
</script>

<div class="s-q-item__footer">
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
