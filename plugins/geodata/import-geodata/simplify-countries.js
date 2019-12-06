const countries = require("./data/osm/countries.json");
const simplifyRegions = require("./simplify-regions.js");
const fs = require("fs");

function simplifyCountries() {
  for (const country of countries) {
    const countryCode = country["ISO3166-1"];
    console.log(`Simplifying regions for country ${countryCode}...`);

    const geojson = JSON.parse(
      fs.readFileSync(`data/osm/regions/clipped/${countryCode}.json`)
    );
    simplifyRegions(geojson.features);
    fs.writeFileSync(
      `data/osm/regions/simplified/${countryCode}.json`,
      JSON.stringify(geojson)
    );
  }
}

simplifyCountries();
