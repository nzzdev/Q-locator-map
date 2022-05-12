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

#### `TILESETS` Explained

- `openmaptiles`: Contains all OpenStreetMap Layers (land, water, city-labels and more) of the whole planet
- `contours`: Contains contours of the whole planet (only displayed between zoom lvl 9 and 14)
- `hillshade`: Contains hillshades of the whole planet (and yes, that includes mountains..)
- `regions`: Contains the regional borders for all countries and subregions

#### `TILESETS` Properties Explained

- `url`: Direct link to the actual `.mbtiles` file of the provider (MapTiler, OSM-Regions)
- `filename`: The filename of the `url` resource
- `path`: Path to the already downloaded (!) `.mbtiles` file on your server
  Boolean Flags (When set to `true`, runs once on docker image instantiation)
- `delete`: Deletes (`unlink`) the file referenced in `path`
- `download`: Downloads the file referenced in `url`
- `transform`: Transforms labels in Tileset according to [mapping file](./mapping.json)
  - This is only needed for the `openmaptiles` Tileset
- `size`: Size of the `url` resource in bytes. Allows for a somewhat accurate progress bar during the download process

## Deployment

The docker image can be built and uploaded by running the `build-docker.sh` script.

1. Deploy `nzzonline/q-locator-map-tilesets` to a docker environment
2. Set the ENV variables as described in the [configuration section](#configuration)

### Deployment of Tilesets (Step-By-Step)

#### A) OSM Tilesets Preparations

1. Get the direct download links (right click, copy link address) for the following 3 Tilesets from MapTiler
   - [OSM Tilesets](https://data.maptiler.com/downloads/tileset/osm/)
   - [OSM Contour](https://data.maptiler.com/downloads/tileset/contours/)
   - [OSM Hillshade](https://data.maptiler.com/downloads/tileset/hillshade/)
2. Add the download links to the respectively named `TILESETS` property as `url` (see the [configuration section](#configuration))
3. Also add the `filename` according to the direct download link filename
4. (Optional) Add the `size` by evaluating the file size in bytes for each Tileset
   - This allows for a somewhat accurate progressbar later on
5. Add the flag `download` set to `true`
6. (OSM Tilesets only!) Add the flag `transform` set to `true`
7. Add the flag `delete` set to `false`

#### B) Regions Tileset Preparations

1. Create a new release of [osm-regions](https://github.com/nzzdev/osm-regions) by following the [step-by-step readme](https://github.com/nzzdev/osm-regions/blob/master/STEPS.md).
2. (Subject to change) Manually upload the `.mbtiles` file to AWS
3. Add the direct link, of the newly created AWS resource, to `TILESETS` `regions` property as `url` (see the [configuration section](#configuration))
4. Also add the `filename` according to the direct link filename
5. (Optional) Add the `size` by evaluating the file size in bytes for each Tileset
   - This allows for a somewhat accurate progressbar later on
6. Add the flags `download` set to `true`
7. Add the flag `delete` set to `false`

#### C) (Conditional) Build Docker

In case of code changes inside the [tilesets folder](./), a new docker image has to be created before deploying the actual Tilesets (`D)`).

1. Raise [package.json](./package.json) & [Dockerfile](./Dockerfile) version
2. Run `build-docker.sh`
3. DO NOT DEPLOY YOUR DOCKER IMAGE YET

#### D) Deploy new OSM & Regions Tilesets

1. Go to your docker environment
2. Make sure the `TILESETS` env variable is set according to Steps `A` & `B`, in your docker environment
3. Deploy your (new) Docker Image on a single instance/node
   - The docker instance will start downloading & processing your Tilesets
   - NOTE: This process can take up to 2 or 3 days (mainly due to the `transform` process)
   - Each `.mbtiles` file will be downloaded to `/data/<tileset-filename>`
4. Go to your `Q-locator-map` docker image and change the `TILESETS` `path` for each Tileset to `/data/<tileset-filename>`
   - Take your time to test the new tilesets before deleting the old ones in Step `E`

#### E) Delete old Tilesets

1. Go to your docker environment
2. Change the `TILESETS` `path` for each Tileset to point to your old `.mbtiles` file
3. Set the `download` (and `transform`) flag to `false`
4. Set the `delete` flag to `true`
5. Redeploy your docker image
   - This triggers the action referenced by each flag
   - This step can also be done manually in the shell
6. After the successful deletion, set the `delete` flag to `false`
7. Change the `path` back to point to your new `.mbtiles` file
