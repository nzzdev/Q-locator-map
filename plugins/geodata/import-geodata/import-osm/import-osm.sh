#!/bin/bash
set -o errexit
set -o nounset

import_osm_root=$(dirname "$0")

"$import_osm_root"/1-list-countries/list-countries.sh
"$import_osm_root"/2-query-regions/query-regions.sh
"$import_osm_root"/3-clip-regions/clip-regions.sh
"$import_osm_root"/4-merge-regions/merge-regions.sh
"$import_osm_root"/5-vector-tiles/vector-tiles.sh
"$import_osm_root"/6-reduce-regions/reduce-regions.sh
"$import_osm_root"/7-split-by-region/split-by-region.sh
"$import_osm_root"/8-simplify-regions/simplify-regions.sh
