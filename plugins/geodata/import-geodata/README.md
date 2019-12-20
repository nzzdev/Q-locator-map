# Import regions from OpenStreetMap

The total process takes about 1 hour.

## Prerequisites

Download land polygons from osmdata, unpack and store the shapefile in `import-osm/0-land-polygons`.
Direct link: https://osmdata.openstreetmap.de/download/land-polygons-complete-4326.zip

Landing page: https://osmdata.openstreetmap.de/data/land-polygons.html
=> Select "WGS 84, Large polygons not split".

## Steps

Run this script to execute all steps listed below:

```bash
import-osm/import-osm.sh
```

#### 1. Query list of countries (Overpass)

Input: Nothing.
Output: List of countries with ISO3166-1 codes.

#### 2. Query regions by country (Overpass)

Input: List of countries with ISO3166-1 codes.
Output: For every country, one GeoJSON file with country and subdivision polygons.

Also store raw data only download if raw data is not available.

#### 3. Clip with land polygons

Input: For every country, one GeoJSON file with country and subdivision polygons.
Output: For every country, one GeoJSON file with country and subdivision polygons.

#### 4. Merge regions

Input: For every country, one GeoJSON file with country and subdivision polygons.
Output: One GeoJSON file with all countries, one GeoJSON file with all subdivisions.

#### 5. Generate vector tiles

Input: One GeoJSON file with all countries, one GeoJSON file with all subdivisions.
Output: mbtiles file with 2 layers (countries, subdivisions).

#### 6. Reduce regions (remove small disconnected parts, e.g. remove French Guiana from France)

Input: For every country, one GeoJSON file with country and subdivision polygons.
Output: For every country, one GeoJSON file with country and subdivision polygons.

#### 7. Split by region

Input: For every country, one GeoJSON file with country and subdivision polygons.
Output: For every region, one GeoJSON file.

#### 8. Simplify regions

Input: For every region, one GeoJSON file.
Output: For every region, one GeoJSON file.

### Clean up

Run this to remove all `output` folders:

```bash
import-osm/remove-outputs.sh
```

# Upload regions for highlighting

Vector tiles are generated in step 5 above, and are stored at
`import-osm/5-vector-tiles/output/regions.mbtiles`.

Give the file an appropriate name, e.g. `regions-2019-12-20.mbtiles`, and upload it to S3, e.g. to `nzz-q-assets-stage/q-locator-map`.

Then use the `q-locator-map-tilesets` service to deploy the tileset.

# Upload regions for minimap

The geodata upload script is responsible for reading geojsons, uploading the geojsons to S3 and storing the metadata in geodata database.

## Description

The script does the following things:

- Reads the geojsons from step 8 above
- Uploads the geojsons to S3 using the Q-Server `/files` route
- Stores the metadata in the geodata database using the `/geodata/{id}` route of the Q-Locator-Map tool

## Configuration

The script needs the following environment variables to work:

```js
process.env.Q_SERVER_BASE_URL = "https://q-server.st-staging.nzz.ch";
process.env.Q_TOOL_BASE_URL =
  "https://q-server.st-staging.nzz.ch/tools/locator_map";
process.env.LD_USERNAME = "manuel.roth@nzz.ch";
process.env.DATASETS = JSON.stringify([
  {
    disable: true,
    version: 1,
    item: "Q252",
    path: "import-osm/8-simplify-regions/output/",
    description: "Gültig ab 20.12.2019",
    validFrom: "Fri Dec 20 2019 00:00:00 GMT+0000 (CET)",
    source: {
      url: "https://www.openstreetmap.org/copyright",
      label: "OpenStreetMap"
    },
    properties: {
      wikidataid: "wikidata",
      name: "name",
      name_de: "name:de",
      type: "type"
    },
    id: "wikidata",
    label: "name:de",
    labelFallback: "name"
  },
  {
    disable: true,
    version: 1,
    path: "import-osm/8-simplify-regions/output/",
    description: "Gültig ab 20.12.2019",
    validFrom: "Fri Dec 20 2019 00:00:00 GMT+0000 (CET)",
    source: {
      url: "https://www.openstreetmap.org/copyright",
      label: "OpenStreetMap"
    },
    properties: {
      wikidataid: "wikidata",
      name: "name",
      name_de: "name:de",
      type: "type"
    },
    id: "wikidata",
    label: "name:de",
    labelFallback: "name"
  }
]);

require("./index.js");
```
