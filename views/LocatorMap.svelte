<script>
  import Header from "./Header.svelte";
  import Legend from "./Legend.svelte";
  import AnnotationsLegend from "./Annotations/AnnotationsLegend.svelte";
  import Footer from "./Footer.svelte";
  export let id;
  export let item;
  export let displayOptions;
  export let config;
</script>

<div
  {id}
  class="s-q-item q-locator-map"
  data-track-id="q-locator-map"
  style="opacity: 0;">
  <Header {item} {displayOptions} />
  <Legend {item} {config} />
  <div id="{id}_container" class="q-locator-map-container" />
  {#if config.styleConfig.hasAttribution}
    <div
      class="q-locator-map-attribution s-font-note-s s-font-note-s--light">
      <span class="s-color-gray-6">
        Kartengrundlage:
        <span>
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer">
            &copy; Openstreetmap,
          </a>
          <a
            href="https://www.maptiler.com/copyright/"
            target="_blank"
            rel="noopener noreferrer">
            &copy; Maptiler
          </a>
        </span>
      </span>
    </div>
  {/if}
  <AnnotationsLegend {item}  />
  <Footer {item} />
</div>
