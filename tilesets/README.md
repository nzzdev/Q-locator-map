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

### Tileset URLs

In order to update the tilesets, the following download URLs can be used:

- For OpenMapTiles: Get URLs from the [download page](https://openmaptiles.com/downloads/planet/) (login with MapTiler/OpenMapTiles account)
- For regions: Create a new release of [osm-regions](https://github.com/nzzdev/osm-regions) and get tiles from there

## Deployment

The docker image can be built and uploaded by running the `build-docker.sh` script.

1. Deploy `nzzonline/q-locator-map-tilesets` to a docker environment
2. Set the ENV variables as described in the [configuration section](#configuration)
