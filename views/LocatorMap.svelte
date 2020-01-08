<script>
  import Header from "./Header.svelte";
  import Legend from "./Legend.svelte";
  import LabelsBelowMap from "./LabelsBelowMap.svelte";
  import Footer from "./Footer.svelte";
  export let id;
  export let item;
  export let displayOptions;
  export let defaultGeojsonStyles;
  export let numberMarkers;
</script>

<div
  {id}
  class="s-q-item q-locator-map"
  data-track-id="q-locator-map"
  style="opacity: 0;">
  <Header {item} {displayOptions} />
  <Legend {item} {defaultGeojsonStyles} />
  <div id="{id}_container" class="q-locator-map-container" />
  <div class="q-locator-map-attribution s-font-note-s s-font-note-s--light">
    Kartengrundlage:
    <span>
      <a href="https://www.maptiler.com/copyright/" target="_blank">
        &copy; MapTiler,
      </a>
      <a href="https://www.openstreetmap.org/copyright" target="_blank">
        &copy; OpenStreetMap contributors
      </a>
    </span>
  </div>
  <LabelsBelowMap {item} {numberMarkers} />
  <Footer {item} />
</div>
