#!/bin/bash
set -o errexit
set -o nounset

import_osm_root=$(dirname "$0")

rm -rf \
  "$import_osm_root"/1-list-countries/output \
  "$import_osm_root"/2-query-regions/output \
  "$import_osm_root"/3-clip-regions/output \
  "$import_osm_root"/4-merge-regions/output \
  "$import_osm_root"/5-vector-tiles/output \
  "$import_osm_root"/6-reduce-regions/output \
  "$import_osm_root"/7-split-by-region/output \
  "$import_osm_root"/8-simplify-regions/output
