## OpenStreetMap scripts

### Prerequisites

Download land polygons.

### Steps

1. Query list of countries (Overpass)

Input: Nothing.
Output: List of countries with ISO3166-1 codes.

2. Query regions by country (Overpass)

Input: List of countries with ISO3166-1 codes.
Output: For every country, one GeoJSON file with country and subdivision polygons.

Also store raw data only download if raw data is not available.

3. Clip with land polygons

Input: For every country, one GeoJSON file with country and subdivision polygons.
Output: For every country, one GeoJSON file with country and subdivision polygons.

4. Merge regions

Input: For every country, one GeoJSON file with country and subdivision polygons.
Output: One GeoJSON file with all countries, one GeoJSON file with all subdivisions.

5. Generate vector tiles

Input: One GeoJSON file with all countries, one GeoJSON file with all subdivisions.
Output: mbtiles file with 2 layers (countries, subdivisions).

6. Reduce regions (remove small disconnected parts, e.g. remove French Guiana from France)

Input: For every country, one GeoJSON file with country and subdivision polygons.
Output: For every country, one GeoJSON file with country and subdivision polygons.

7. Split by region

Input: For every country, one GeoJSON file with country and subdivision polygons.
Output: For every region, one GeoJSON file.

8. Simplify regions

Input: For every region, one GeoJSON file.
Output: For every region, one GeoJSON file.

### Clean up

## Geodata import script

The geodata import script is responsible for converting shapefiles to geojson, uploading the geojson's to S3 and storing the metadata in geodata database.

### Description

The script does the following things:

- Reads the shapefiles in the folder `/data` and converts all the features to geojson
- Uploads the geojson to S3 using the Q-Server `/files` route
- Stores the metadata in the geodata database using the `/geodata/{id}` route of the Q-Locator-Map tool

### Configuration

The script needs the following environment variables to work:

```js
process.env.Q_SERVER_BASE_URL = "https://q-server.st-staging.nzz.ch";
process.env.Q_TOOL_BASE_URL =
  "https://q-server.st-staging.nzz.ch/tools/locator_map";
process.env.LD_USERNAME = "manuel.roth@nzz.ch";
process.env.DATASETS = `[
  {
    disable: true,
    version: 1,
    item: "Q252",
    path: "/data/ne_10m_admin_0_countries/ne_10m_admin_0_countries",
    "description": "Gültig ab 24.05.2018",
    "validFrom": "Thu May 24 2018 00:00:00 GMT+0000 (CET)",
    "source": {
      "url": "https://www.naturalearthdata.com",
      "label": "Natural Earth"
    },
    properties: {
      wikidataid: "WIKIDATAID",
      name: "NAME",
      name_de: "NAME_DE",
      name_fr: "NAME_FR",
      name_it: "NAME_IT",
      name_en: "NAME_EN",
      postal: "POSTAL",
      abbrevation: "ABBREV",
      continent: "CONTINENT"
    },
    id: "WIKIDATAID",
    label: "NAME_DE",
    labelFallback: "NAME"
  },
  {
    disable: true,
    version: 1,
    path: "/data/ne_10m_admin_0_countries/ne_10m_admin_0_countries",
    "description": "Gültig ab 24.05.2018",
    "validFrom": "Thu May 24 2018 00:00:00 GMT+0000 (CET)",
    "source": {
      "url": "https://www.naturalearthdata.com",
      "label": "Natural Earth"
    },
    properties: {
      wikidataid: "WIKIDATAID",
      name: "NAME",
      name_de: "NAME_DE",
      name_fr: "NAME_FR",
      name_it: "NAME_IT",
      name_en: "NAME_EN",
      postal: "POSTAL",
      abbrevation: "ABBREV",
      continent: "CONTINENT"
    },
    id: "WIKIDATAID",
    label: "NAME_DE",
    labelFallback: "NAME"
  },
  {
    disable: true,
    version: 1,
    item: "Q752346",
    path:
      "/data/ne_10m_admin_1_states_provinces/ne_10m_admin_1_states_provinces",
    "description": "Gültig ab 24.05.2018",
    "validFrom": "Thu May 24 2018 00:00:00 GMT+0000 (CET)",
    "source": {
      "url": "https://www.naturalearthdata.com",
      "label": "Natural Earth"
    },
    properties: {
      wikidataid: "wikidataid",
      name: "name",
      name_de: "name_de",
      name_fr: "name_fr",
      name_it: "name_it",
      name_en: "name_en",
      postal: "postal",
      country: "admin"
    },
    id: "wikidataid",
    label: "name_de",
    labelFallback: "name"
  },
  {
    version: 1,
    path:
      "/data/ne_10m_admin_1_states_provinces/ne_10m_admin_1_states_provinces",
    "description": "Gültig ab 24.05.2018",
    "validFrom": "Thu May 24 2018 00:00:00 GMT+0000 (CET)",
    "source": {
      "url": "https://www.naturalearthdata.com",
      "label": "Natural Earth"
    },
    properties: {
      wikidataid: "wikidataid",
      name: "name",
      name_de: "name_de",
      name_fr: "name_fr",
      name_it: "name_it",
      name_en: "name_en",
      postal: "postal",
      country: "admin"
    },
    id: "wikidataid",
    label: "name_de",
    labelFallback: "name"
  }
]`;

require("./index.js");
```
