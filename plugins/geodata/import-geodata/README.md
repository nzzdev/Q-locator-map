# Import regions from OpenStreetMap

This script uploads simplified region geometries in the GeoJSON format to S3 and stores metadata in the geodata database.

The data comes from the [osm-regions](https://github.com/nzzdev/osm-regions) project.

The simplified region geometries are used for minimaps. Whenever they are updated, the `regions` tileset, which is used
for highlighting regions, should be updated as well, see [tilesets](../../../tilesets).

## Preparation

Download simplified regions from the latest [osm-regions](https://github.com/nzzdev/osm-regions) release and place them in `./simplified-regions`.

## Description

The script does the following things:

- Reads the geojsons from `/simplified-regions`
- Uploads the geojsons to S3 using the Q-Server `/files` route
- Stores the metadata in the geodata database

## Configuration

The script needs the following environment variables to work:

```js
process.env.Q_SERVER_BASE_URL = "https://q-server.st-staging.nzz.ch";
process.env.Q_TOOL_BASE_URL =
  "https://q-server.st-staging.nzz.ch/tools/locator_map";
process.env.LD_USERNAME = "manuel.roth@nzz.ch";
process.env.COUCHDB = `{
  "host": "...",
  "database": "...",
  "user": "...",
  "pass": "..."
}`;
process.env.DATASETS = JSON.stringify([
  {
    disable: true,
    version: 1,
    item: "Q252",
    path: "simplified-regions/",
    description: "Gültig ab 20.12.2019",
    validFrom: "Fri Dec 20 2019 00:00:00 GMT+0000 (CET)",
    source: {
      url: "https://www.openstreetmap.org/copyright",
      label: "OpenStreetMap",
    },
    properties: {
      wikidataid: "wikidata",
      name: "name",
      name_de: "name:de",
      type: "type",
    },
    id: "wikidata",
    label: "name:de",
    labelFallback: "name",
  },
  {
    disable: true,
    version: 1,
    path: "simplified-regions/",
    description: "Gültig ab 20.12.2019",
    validFrom: "Fri Dec 20 2019 00:00:00 GMT+0000 (CET)",
    source: {
      url: "https://www.openstreetmap.org/copyright",
      label: "OpenStreetMap",
    },
    properties: {
      wikidataid: "wikidata",
      name: "name",
      name_de: "name:de",
      type: "type",
    },
    id: "wikidata",
    label: "name:de",
    labelFallback: "name",
  },
]);

require("./index.js");
```
