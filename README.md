# Q Locator Map [![Build Status](https://travis-ci.com/nzzdev/Q-locator-map.svg?token=bwR7zbPTTpEoDxbY2dJR&branch=dev)](https://travis-ci.com/nzzdev/Q-locator-map)

**Maintainer**: [manuelroth](https://github.com/manuelroth)

Q locator map is a tool of the Q toolbox which allows to create locator maps.
Test it in the [demo](https://q-demo.st.nzz.ch/).

## Table of contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Functionality](#functionality)
- [License](#license)

## Installation

```bash
git clone git@github.com:nzzdev/Q-locator-map.git
cd ./Q-locator-map
nvm use
npm install
npm run build
```

[to the top](#table-of-contents)

## Configuration

Q locator map is configured by the following env variables and through config passed in `toolRuntimeConfig`:

### TILESETS

Q locator map renders maps using vector tiles. The `TILESETS` env variable defines one or more tilesets which are used for the map. The `TILESETS` env variable needs to be defined like this:

```
{
  "openmaptiles": {
    "path": "/data/openmaptiles.mbtiles"
  },
  "contours": {
    "path": "/data/contours.mbtiles"
  },
  "hillshade": {
    "url": "https://www.example.com/hillshade/{z}/{x}/{y}.png"
  },
  "regions": {
    "url": "https://www.example.com/regions/{z}/{x}/{y}.pbf"
  }
}
```

A tileset can be defined as path to the [mbtiles](https://docs.mapbox.com/help/glossary/mbtiles/) file or as an url to an endpoint serving tiles.

### COUCHDB

The tool uses a database to get geodata of countries and states to generate minimaps. The `COUCHDB` env variable defines the connection parameters to reach the database:

```
{
  "host": "...",
  "database": "...",
  "user": "...",
  "pass": "..."
}
```

### MAPBOX_ACCESS_TOKEN

Mapbox is used for the satellite basemap. The `MAPBOX_ACCESS_TOKEN` env variable defines the access token required to use it.

### MEMORY_CACHE_SIZE

The tool uses the [@hapi/catbox-memory](https://github.com/hapijs/catbox-memory) package to cache resources in memory. The `MEMORY_CACHE_SIZE` env variable allows to configure the size of the memory cache in bytes.

### toolRuntimeConfig

Q locator maps needs configuration passed in `toolRuntimeConfig` to the `/rendering-info/web` endpoint. The fonts config is mandatory and all other parameters are optional. See the following example:

```
toolRuntimeConfig: {
  styleConfig: {
    // mandatory
    fonts: {
      fontBaseUrl: "https://www.example.com/fonts/",
      fontSansLight: {
        name: "Noto-Sans-Light"
      },
      fontSansRegular: {
        name: "Noto-Sans-Regular"
      },
      fontSansMedium: {
        name: "Noto-Sans-Medium"
      },
      fontSerifRegular: {
        name: "Noto-Serif-Regular"
      }
    },
    // optional
    colors: {
      basic: {
        background: "#f0f0f2",
        water: "#d0e2ec",
        waterText: "#428cb3",
        waterway: "#d0e2ec",
        forest: "#99c7a3",
        road: "#dfe0e5",
        railway: "#d8d9db",
        building: "#e3e3e8",
        text: "#92929e",
        boundaryCountry: "#a88ea8",
        boundaryState: "#c9c4e0",
        boundaryCommunity: "#d4c1ee"
      },
      minimal: {
        background: "#f0f0f2",
        water: "#cee1e6",
        waterText: "#428cb3",
        waterway: "#d6d6d6",
        forest: "#e6e9e5",
        road: "#f5f5f5",
        railway: "#d8d8d8",
        building: "#cbcbcb",
        text: "#92929e",
        boundary: "#cfcfd6"
      },
      nature: {
        background: "#edece1",
        water: "#d0e2ec",
        waterText: "#428cb3",
        waterway: "#d0e2ec",
        forest: "#99c7a3",
        road: "#dbdad1",
        railway: "#d9d9d9",
        building: "#dbdad1",
        text: "#92929e",
        boundary: "#b6b6be",
        hillshadeOpacity: 0.2
      },
      satellite: {
        background: "#f0f0f2",
        water: "#d0e2ec",
        waterText: "#428cb3",
        waterway: "#d0e2ec",
        forest: "#e6e9e5",
        road: "#f5f5f5",
        railway: "#d8d8d8",
        building: "#cbcbcb",
        text: "#92929e",
        boundary: "#ffffff"
      }
    },
    markers: {
      textHaloWidth: 1,
      textBlurWidth: 0.1,
      textLetterSpacing: 0.2,
      textTransform: "none",
      textAnchor: {
        stops: [
          [7.99, "left"],
          [8, "center"]
        ]
      },
      textJustify: "left",
      textOffset: [0, 0],
      iconSize: 1,
      iconMarker: {
        textColorIconMarker: "#05032d",
        textHaloColorIconMarker: "#ffffff",
        textSizeIconMarker: 14,
        textFontIconMarker: ["{fontSansMedium}"]
      },
      country: {
        textSizeCountry: 14,
        textColorCountry: "#6e6e7e",
        textTransformCountry: "none"
      },
      capital: {
        textSizeCapital: 15,
        textTranslateCapital: [10, 0],
        iconImageCapital: {
          stops: [
            [7.99, "capital"],
            [8, ""]
          ]
        }
      },
      city: {
        textSizeCity: 13,
        textTranslateCity: [7, 0],
        iconImageCity: {
          stops: [
            [7.99, "city"],
            [8, ""]
          ]
        }
      },
      label: {
        textTransformLabel: "uppercase"
      },
      line: {
        colorLine: "#c31906",
        widthLine: 2,
        opacityLine: 1,
        dashedLine: [1, 3]
      },
      polygon: {
        fillColorPolygon: "#c31906",
        outlineWidthPolygon: 0,
        opacityPolygon: 0.35
      }
    },
    highlightRegion: {
      highlightCountryColor: "#ffffff",
      highlightRegionColor: "#d7cddc"
    },
    minimap: {
      hasShadow: true,
      landColor: "#ffffff",
      textColor: "#6e6e7e",
      bboxColor: "#000000",
      textSize: 12,
      globe: {
        width: 90,
        landOutlineColor: "#b6b6be",
        landOutlineWidth: 0.5,
        waterColor: "#d0e2ec"
      },
      region: {
        width: 120,
        minWidth: 40,
        landOutlineColor: "#b6b6be",
        landOutlineWidth: 0.5
      }
    },
    scale: {
      textSize: 11,
      textColor: "#6e6e7e",
      textHaloWidth: 1,
      borderWidth: 1.5
    },
    aspectRatioBreakpoint: 450,
    hasAttribution: true
  }
}
```

The `toolRuntimeConfig` is also configured in `cli-config.js` to be used with [Q-CLI](https://github.com/nzzdev/Q-cli)

[to the top](#table-of-contents)

## Development

Start the Q dev server:

```
npx @nzz/q-cli server -c ./dev-config/server-config.js
```

Run the Q tool:

```
node dev.js
```

[to the top](#table-of-contents)

## Testing

The testing framework used in this repository is [Code](https://github.com/hapijs/code).

Run the tests:

```
npm run test
```

### Implementing a new test

When changing or implementing...

- A `route`, it needs to be tested in the `e2e-tests.js` file
- Something on the frontend, it needs to be tested in the `dom-tests.js` file

[to the top](#table-of-contents)

## Deployment

We provide automatically built docker images at https://hub.docker.com/r/nzzonline/q-locator-map/.
There are three options for deployment:

- use the provided images
- build your own docker images
- deploy the service using another technology

### Use the provided docker images

1. Deploy `nzzonline/q-locator-map` to a docker environment
2. Set the ENV variables as described in the [configuration section](#configuration)

[to the top](#table-of-contents)

## Functionality

The tool structure follows the general structure of each Q tool. Further information can be found in [Q server documentation - Developing tools](https://nzzdev.github.io/Q-server/developing-tools.html).

Q Locator Map uses the [svelte](https://svelte.dev/) framework to render the markup like header and footer on server-side. The map gets rendered on client-side using the [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/overview/) framework. The tool uses various other opensource packages like [Turf](https://turfjs.org/), [Vega](https://vega.github.io/vega/), [Mapshaper](https://mapshaper.org/) and many more to help build a great Locato Map tool. Check the [package.json](./package.json) file for more information.

Vector tiles of the basemap are provided by the [OpenMapTiles](https://openmaptiles.org/) project. The geodata of countries and states used for minimaps and highlighted regions are based on [OpenStreetMap](https://www.openstreetmap.org/) and [Natural Eath](https://www.naturalearthdata.com/).

### Options

#### dimension

This option allows to overwrite the visible area of the map. It is defined based on a bounding box that the user defines. With the option `useDefaultAspectRatio` it is possible to define a custom aspect ratio of the map. This can be helpful for maps that show very long or wide countries like Chile or Russia.

### baseLayer

This option allows to switch between four different basemaps (standard, minimal, nature and satellite). The `layers` option allows to disable certain layer of the map (labels).

#### minimap

This option defines whether a minimap is shown and which type (globe or region). The `position` option defines in which corner the minimap is shown. If the minimap is positioned in the bottom left corner the scale is moved to the top left corner.

#### highlightRegion

This option defines one or more regions which should be highlighted on the map.

#### labelsBelowMap and labelsBelowMapOneRow

This option allows to show the labels of the points which the user entered to be shown below the map. `labelsBelowMapOneRow` option defines whether the labels should be shown on a single row.

#### showLegend

This options allows to show the legend. The legend is only shown for linestring and polygon features.

#### Display Options

Display options can be set before embedding the graphic in the article.

##### hideTitle

Allows to hide the title

[to the top](#table-of-contents)

## License

Copyright (c) 2020 Neue Zürcher Zeitung. All rights reserved.

This software is published under the [MIT](LICENSE) license.

[to the top](#table-of-contents)
