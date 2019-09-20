<script>
  import Header from "./Header.svelte";
  import Legend from "./Legend.svelte";
  import LabelsBelowMap from "./LabelsBelowMap.svelte";
  import Footer from "./Footer.svelte";
  export let id;
  export let item;
  export let displayOptions;
  export let defaultGeojsonStyles;
</script>

<div
  {id}
  class="s-q-item q-locator-map"
  data-track-id="q-locator-map"
  style="opacity: 0;">
  <Header {item} {displayOptions} />
  <Legend {item} {defaultGeojsonStyles} />
  <div id="{id}_container" class="q-locator-map-container" />
  <LabelsBelowMap {item} />
  <Footer {item} />
</div>
