# Import regions from OpenStreetMap

The total process takes about 1 hour.

## Prerequisites

### Land polygons

Download "WGS 84, Large polygons not split" from osmdata, unpack and store the shapefile in

- `00-static-data/land-polygons-complete-4326`

Direct link: https://osmdata.openstreetmap.de/download/land-polygons-complete-4326.zip

Landing page: https://osmdata.openstreetmap.de/data/land-polygons.html

You may want to open the file in mapshaper and check that the polygons do not self-intersect, because clipping with self-intersecting polygons will corrupt data. For example, clipping with these polygons removes most of Japan from the output:

<img src="screenshot_mapshaper.png" alt="Screenshot" width="640">

You can also use
[this snapshot of land polygons](https://nzz-q-assets-stage.s3.amazonaws.com/q-locator-map/land-polygons-complete-4326_2019-11-18.zip)
with correct polygons.

### Natural earth

Natural earth data (1:10m Cultural Vectors) is used for zoom levels 0 to 4 for compatibility with OpenMapTiles.

Download "countries" and "states and provinces" and unpack and store the shapefiles in

- `00-static-data/ne_10m_admin_0_countries`
- `00-static-data/ne_10m_admin_1_states_provinces`

Direct links:

- https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries.zip
- https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_1_states_provinces.zip

Landing page: https://www.naturalearthdata.com/downloads/10m-cultural-vectors/

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

#### 4. Reduce regions (remove small disconnected parts, e.g. remove French Guiana from France)

Input: For every country, one GeoJSON file with country and subdivision polygons.
Output: For every country, one GeoJSON file with country and subdivision polygons.

#### 5. Split by region

Input: For every country, one GeoJSON file with country and subdivision polygons.
Output: For every region, one GeoJSON file.

#### 6. Simplify regions

Input: For every region, one GeoJSON file.
Output: For every region, one GeoJSON file.

#### 7. Merge regions

Input: For every country, one GeoJSON file with country and subdivision polygons.
Output: One GeoJSON file with all countries, one GeoJSON file with all subdivisions.

#### 8. Generate vector tiles

Input: One GeoJSON file with all countries, one GeoJSON file with all subdivisions.
Output: mbtiles file with 2 layers (countries, subdivisions).

#### 9. Convert natural earth data to GeoJSON

Input: Shapefiles with countries and states/provinces.
Output: GeoJSON files with countries and states/provinces.

#### 10. Generate vector tiles (natural earth)

Input: GeoJSON files with countries and states/provinces.
Output: mbtiles file with 2 layers (countries, subdivisions).

#### 11. Join tiles

Input: mbtiles files from steps 8/10.
Output: mbtiles file with 2 layers (countries, subdivisions), using natural earth data for zoom levels 0-4 and Openstreetmap data for zoom levels 5-10.

### Clean up

Run this to remove all `output` folders:

```bash
import-osm/remove-outputs.sh
```

# Preview vector tiles

Run this script to preview the vector tiles generated in step 11.

```bash
import-osm/preview-tiles.sh
```

# Upload regions for highlighting

Vector tiles are generated in step 11 above, and are stored at
`import-osm/11-join-tiles/output/regions.mbtiles`.

Give the file an appropriate name, e.g. `regions-2019-12-20.mbtiles`, and upload it to S3, e.g. to `nzz-q-assets-stage/q-locator-map`.

Then use the `q-locator-map-tilesets` service to deploy the tileset.

# Upload regions for minimap

The geodata upload script is responsible for reading geojsons, uploading the geojsons to S3 and storing the metadata in geodata database.

## Description

The script does the following things:

- Reads the geojsons from step 6 above
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
    path: "import-osm/06-simplify-regions/output/",
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
    path: "import-osm/06-simplify-regions/output/",
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
