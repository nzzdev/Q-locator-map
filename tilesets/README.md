## Service to manage tilesets for the Q Locator Maps tool

The service can download or delete a tileset. It is designed to run once on a single instance. Each tileset has a flag download and delete. The service will download or delete the tileset depending on the value of the flag.

### Configuration

- `ENV` must be set to `local` when running the service on a local machine
- `TILESETS` is a JSON object with containing metadata for each tileset. See the example below:

```json
{
  "openmaptiles": {
    "url": "https://openmaptiles.com/download/.eJwFwcERwCAIBMBefMvMCacJtWTyECL9l5Ddp23cLCIlToawQHHVkGuY2UoMsFpv27y4ywUrphAGucNT8CGXu-ZZs_VBur4_m44VEg.XSNhSQ.yP4kLh3nZelCDDTMnG_H_I9DDV8/osm-2019-06-24-v3.10-planet.mbtiles",
    "filename": "openmaptiles-2019-06-24-v3.10-planet.mbtiles",
    "delete": false,
    "download": false,
    "size": 66330000000
  },
  "contours": {
    "url": "https://openmaptiles.com/download/.eJwFwcERgDAIBMBeeIeZIxCUWhwfAUP_Jbj70MZtbSjOU8nWMI45ky9RVS8IrGnQ1mjbHQzPxQYF3xnF-FAeMev4oiEmoe8Pm4QVEA.XSNhfw.Bk4nqijAsT4V2eQ9y77Z8gYT4_g/contours-2019-04-10-planet.mbtiles",
    "filename": "contours-2019-04-10-planet.mbtiles",
    "delete": false,
    "download": false,
    "size": 142660000000
  },
  "hillshade": {
    "url": "https://openmaptiles.com/download/.eJwFwcERgDAIBMBe8paZCxCEWhwfAUP_Jbj7jA3XVhTlqSRtKAVz0j1FxAoT2uMaW6J1dxAsFykE5BlF-FAWwXVsjWs6-_sDhq8U4Q.XSNhqg.eG7FWyfJipzGm5HXi96fYMzXJD0/hillshade-2016-11-28-planet.mbtiles",
    "filename": "hillshade-2016-11-28-planet.mbtiles",
    "delete": false,
    "download": false,
    "size": 83030000000
  },
  "regions": {
    "url": "https://nzz-q-assets-stage.s3.amazonaws.com/q-locator-map/regions-2019-12-20.mbtiles",
    "filename": "regions-2019-12-20.mbtiles",
    "delete": false,
    "download": false,
    "size": 220409856
  }
}
```

#### Tilesets Explained

- `openmaptiles`: Contains all OpenStreetMap Layers (land, water, city-labels and more) of the whole planet
- `contours`: Contains contours of the whole planet (only displayed between zoom lvl 9 and 14)
- `hillshade`: Contains hillshades of the whole planet (and yes, that includes mountains..)
- `regions`: Contains the regional borders for all countries and subregions

#### Properties Explained

- `url`: Direct link to the actual `.mbtiles` file of the provider (MapTiler, OSM-Regions)
- `filename`: The filename of the `url` resource
- `path`: Path to the already downloaded (!) `.mbtiles` file on your server
  Boolean Flags (When set to `true`, runs once on docker image instantiation)
- `delete`: Deletes (`unlink`) the file referenced in `path`
- `download`: Downloads the file referenced in `url`
- `transform`: Transforms labels in Tileset according to [mapping file](./mapping.json)
  - This is only needed for the `openmaptiles` Tileset
- `size`: Allows for a somewhat accurate progress bar during the download process

### Tileset URLs

In order to update the tilesets, the following download URLs can be used:

- For OpenMapTiles: Get URLs from the [download page](https://openmaptiles.com/downloads/planet/) (login with MapTiler/OpenMapTiles account)
- For regions: Create a new release of [osm-regions](https://github.com/nzzdev/osm-regions) and get tiles from there

## Deployment

The docker image can be built and uploaded by running the `build-docker.sh` script.

1. Deploy `nzzonline/q-locator-map-tilesets` to a docker environment
2. Set the ENV variables as described in the [configuration section](#configuration)

### Deployment of Tilesets (Step-By-Step)

#### A) OSM Tilesets

1. Get the direct download links (right click, copy link address) for the following 3 Tilesets from MapTiler
   - [OSM Tilesets](https://data.maptiler.com/downloads/tileset/osm/)
   - [OSM Contour](https://data.maptiler.com/downloads/tileset/contours/)
   - [OSM Hillshade](https://data.maptiler.com/downloads/tileset/hillshade/)
2. Add the download links to the respectively named `TILESETS` property as `url` (see the [configuration section](#configuration))
3. Also add the `filename` according to the direct download link filename
4. (Optional) Add the `size` by evaluating the file size in bytes for each Tileset
   - This allows for a somewhat accurate progressbar later on
5. Add the flags `download` & `transform`, both set to `true`
6. Add the flag `delete` set to `false`

#### B) Regions Tileset

1. Create a new release of [osm-regions](https://github.com/nzzdev/osm-regions) by following the [step-by-step readme](https://github.com/nzzdev/osm-regions/blob/master/STEPS.md).
   (Subject to change)
2. Manually upload the `.mbtiles` file to AWS
3. Add the direct link, of the newly created AWS resource, to `TILESETS.regions` property as `url` (see the [configuration section](#configuration))
4. Also add the `filename` according to the direct link filename
5. (Optional) Add the `size` by evaluating the file size in bytes for each Tileset
   - This allows for a somewhat accurate progressbar later on
6. Add the flags `download` set to `true`
7. Add the flag `delete` set to `false`

#### B) Regions Tileset

(WIP)
