#!/bin/bash
set -o errexit
set -o nounset

step_root=$(dirname "$0")
countries_file="$step_root/../1-list-countries/output/countries.json"
output_dir="$step_root/output"

mkdir -p "$output_dir"
mkdir -p "$output_dir/raw"

node "$step_root/query-regions.js" "$countries_file" "$output_dir"
