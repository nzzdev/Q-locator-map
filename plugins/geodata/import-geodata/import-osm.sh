#!/bin/bash
set -o errexit
set -o nounset

mkdir -p data/osm/regions/raw
mkdir -p data/osm/regions/clipped

curl https://overpass-api.de/api/interpreter \
  --compressed \
  --data 'data=[out:csv(::"id", "ISO3166-1", wikidata, name, "name:de")]; relation[boundary=administrative][admin_level=2]["ISO3166-1"]; out;' \
  | npx tsv2json \
  | npx prettier \
    --parser json \
    > data/osm/countries.json

node fetch-osm-countries.js | tee data/osm/last-run.log

# npx mapshaper \
#   -i data/osm/regions/*.geojson combine-files no-topology -merge-layers \   <= load geometries for all countries and merge them
#   -split admin_level \                                                      <= split before clipping to work around a bug with overlapping geometries...
#   -clip data/osmdata/land-polygons-complete-4326/land_polygons.shp \
#   -merge-layers \                                                           <= ...and merge again
#   -split type \
#   -o format=geojson target=country data/osm/countries-clipped.geojson \
#   -o format=geojson target=subdivision data/osm/subdivisions-clipped.geojson

npx mapshaper \
  -i data/osm/regions/*.geojson combine-files no-topology -merge-layers \
  -split admin_level \
  -clip data/osmdata/land-polygons-complete-4326/land_polygons.shp \
  -merge-layers \
  -split type \
  -o format=geojson target=country data/osm/countries-clipped.geojson \
  -o format=geojson target=subdivision data/osm/subdivisions-clipped.geojson

tippecanoe \
  --minimum-zoom=0 \
  --maximum-zoom=10 \
  --named-layer='{"file": "data/osm/countries-clipped.geojson", "layer": "countries"}' \
  --named-layer='{"file": "data/osm/subdivisions-clipped.geojson", "layer": "subdivisions"}' \
  --include=wikidata \
  --simplification=4 \
  --simplify-only-low-zooms \
  -o data/osm/regions.mbtiles

exit

## New implementation with split files separate by country

npx mapshaper \
  -i data/osm/regions/*.geojson combine-files no-topology -merge-layers \
  -split admin_level \
  -clip data/osmdata/land-polygons-complete-4326/land_polygons.shp \
  -merge-layers \
  -split ISO3166-1 \
  -o format=geojson data/osm/regions/clipped/

npx mapshaper \
  -i data/osm/regions/clipped/*.json combine-files no-topology -merge-layers \
  -split type \
  -o format=geojson target=country data/osm/countries-clipped.geojson \
  -o format=geojson target=subdivision data/osm/subdivisions-clipped.geojson