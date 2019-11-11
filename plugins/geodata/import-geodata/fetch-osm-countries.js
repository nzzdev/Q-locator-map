const countries = require("./data/osm/countries.json");
const fetchOsmRegions = require("./fetch-osm-regions.js");
const fs = require("fs");

async function fetchCountries() {
  for (const country of countries) {
    const countryCode = country["ISO3166-1"];
    console.log(`Fetching regions for country ${countryCode}...`);

    const rawDataPath = `data/osm/regions/raw/${countryCode}.json`;
    let oldRawData;
    if (fs.existsSync(rawDataPath)) {
      oldRawData = JSON.parse(fs.readFileSync(rawDataPath));
    }

    const { geojson, rawData } = await fetchOsmRegions(countryCode, oldRawData);
    if (!oldRawData) {
      fs.writeFileSync(rawDataPath, JSON.stringify(rawData));
    }
    fs.writeFileSync(
      `data/osm/regions/${countryCode}.geojson`,
      JSON.stringify(geojson)
    );
  }
}

fetchCountries();
