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
