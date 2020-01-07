import Sprites from "../resources/sprites/sprites@1x.json";

export function getStyle(data) {
  return fetch(
    `${data.config.toolBaseUrl}/styles/${
      data.config.styles[data.options.baseLayer.style].hash
    }/${data.options.baseLayer.style}`
  )
    .then(response => {
      if (response.ok) {
        return response.json();
      }
    })
    .then(style => {
      style = filterByLayer(style, data);
      style = addHighlightedRegions(style, data);
      style = addFeatures(style, data);
      style = applyConfig(style, data);
      return style;
    });

  function applyConfig(style, data) {
    const colors = data.config.styleConfig.colors[style.name];
    const labels = data.config.styleConfig.labels;
    style = JSON.parse(
      JSON.stringify(style)
        .replace(/{colorBackground}/g, colors.background)
        .replace(/{colorWater}/g, colors.water)
        .replace(/{colorWaterText}/g, colors.waterText)
        .replace(/{colorWaterway}/g, colors.waterway)
        .replace(/{colorOceanText}/g, colors.oceanText)
        .replace(/{colorForest}/g, colors.forest)
        .replace(/{colorRoad}/g, colors.road)
        .replace(/{colorRoadText}/g, colors.roadText)
        .replace(/{colorRailway}/g, colors.railway)
        .replace(/{colorBuilding}/g, colors.building)
        .replace(/{colorText}/g, colors.text)
        .replace(/{colorHighlightedCountry}/g, colors.highlightedCountry)
        .replace(/{colorHighlightedRegion}/g, colors.highlightedRegion)
        .replace(/"{textHaloWidth}"/g, labels.textHaloWidth)
        .replace(
          /"{textSizeCountry}"/g,
          JSON.stringify(labels.country.textSizeCountry)
        )
        .replace(/{textColorCountry}/g, labels.country.textColorCountry)
        .replace(
          /"{textHaloWidthCountry}"/g,
          labels.country.textHaloWidthCountry
        )
        .replace(/{textTransformCountry}/g, labels.country.textTransformCountry)
        .replace(
          /"{textSizeCapital}"/g,
          JSON.stringify(labels.capital.textSizeCapital)
        )
        .replace(/"{textSizeCity}"/g, JSON.stringify(labels.city.textSizeCity))
        .replace(
          /"{textSizeWater}"/g,
          JSON.stringify(labels.water.textSizeWater)
        )
        .replace(
          /"{textHaloWidthWater}"/g,
          JSON.stringify(labels.water.textHaloWidthWater)
        )
        .replace(
          /{fontSansLight}/g,
          data.config.styleConfig.fonts.fontSansLight.name
        )
        .replace(
          /{fontSansRegular}/g,
          data.config.styleConfig.fonts.fontSansRegular.name
        )
        .replace(
          /{fontSansMedium}/g,
          data.config.styleConfig.fonts.fontSansMedium.name
        )
        .replace(
          /{fontSerifRegular}/g,
          data.config.styleConfig.fonts.fontSerifRegular.name
        )
        .replace(/{fontBaseUrl}/g, data.config.styleConfig.fonts.fontBaseUrl)
        .replace(/{fontHash}/g, data.config.fontHash)
        .replace(/{mapboxAccessToken}/g, data.config.mapboxAccessToken)
        .replace(/{toolBaseUrl}/g, data.config.toolBaseUrl)
    );

    if (["basic", "minimal"].includes(style.name)) {
      style = JSON.parse(
        JSON.stringify(style)
          .replace(/{colorBoundaryCountry}/g, colors.boundaryCountry)
          .replace(/{colorBoundaryState}/g, colors.boundaryState)
          .replace(/{colorBoundaryCommunity}/g, colors.boundaryCommunity)
      );
    } else if (["nature", "satellite"].includes(style.name)) {
      style = JSON.parse(
        JSON.stringify(style).replace(/{colorBoundary}/g, colors.boundary)
      );
    }
    return style;
  }

  function getPositionProperties(geojsonProperties) {
    if (
      Sprites[geojsonProperties.type] ||
      ["event", "number"].includes(geojsonProperties.type)
    ) {
      const padding = 2;
      let translateVertical = 0;
      let translateHorizontal = 0;
      let translateFactor = 2;
      let iconOffset = 6;
      let cornerTranslateFactor = 1.4;
      if (geojsonProperties.type === "event") {
        geojsonProperties.type = `arrow-${geojsonProperties.labelPosition}`;
        translateFactor = 1.2;
        cornerTranslateFactor = 1.2;
      } else if (geojsonProperties.type === "number") {
        geojsonProperties.type = `number-${geojsonProperties.index}`;
      }

      if (Sprites[geojsonProperties.type]) {
        translateVertical =
          Sprites[geojsonProperties.type].height / translateFactor + padding;
        translateHorizontal =
          Sprites[geojsonProperties.type].width / translateFactor + 2 * padding;
      }

      const properties = {
        textAnchor: "bottom",
        textJustify: "center",
        textTranslate: [0, -translateVertical],
        iconOffset: [0, iconOffset]
      };
      if (geojsonProperties.labelPosition === "bottom") {
        properties.textAnchor = "top";
        properties.textTranslate = [0, translateVertical];
        properties.iconOffset = [0, -iconOffset];
      } else if (geojsonProperties.labelPosition === "left") {
        properties.textAnchor = "right";
        properties.textTranslate = [-translateHorizontal, 0];
        properties.iconOffset = [iconOffset, 0];
        properties.textJustify = "right";
      } else if (geojsonProperties.labelPosition === "right") {
        properties.textAnchor = "left";
        properties.textTranslate = [translateHorizontal, 0];
        properties.iconOffset = [-iconOffset, 0];
        properties.textJustify = "left";
      } else if (geojsonProperties.labelPosition === "topleft") {
        properties.textAnchor = "bottom-right";
        properties.textTranslate = [
          -translateHorizontal / cornerTranslateFactor,
          -translateVertical / cornerTranslateFactor
        ];
        properties.iconOffset = [
          iconOffset / cornerTranslateFactor,
          iconOffset / cornerTranslateFactor
        ];
        properties.textJustify = "right";
      } else if (geojsonProperties.labelPosition === "topright") {
        properties.textAnchor = "bottom-left";
        properties.textTranslate = [
          translateHorizontal / cornerTranslateFactor,
          -translateVertical / cornerTranslateFactor
        ];
        properties.iconOffset = [
          -iconOffset / cornerTranslateFactor,
          iconOffset / cornerTranslateFactor
        ];
        properties.textJustify = "left";
      } else if (geojsonProperties.labelPosition === "bottomleft") {
        properties.textAnchor = "top-right";
        properties.textTranslate = [
          -translateHorizontal / cornerTranslateFactor,
          translateVertical / cornerTranslateFactor
        ];
        properties.iconOffset = [
          iconOffset / cornerTranslateFactor,
          -iconOffset / cornerTranslateFactor
        ];
        properties.textJustify = "right";
      } else if (geojsonProperties.labelPosition === "bottomright") {
        properties.textAnchor = "top-left";
        properties.textTranslate = [
          translateHorizontal / cornerTranslateFactor,
          translateVertical / cornerTranslateFactor
        ];
        properties.iconOffset = [
          -iconOffset / cornerTranslateFactor,
          -iconOffset / cornerTranslateFactor
        ];
        properties.textJustify = "left";
      }
      return properties;
    } else {
      return {
        textAnchor: "center",
        textJustify: "center",
        textTranslate: [0, 0]
      };
    }
  }

  function getPointStyleProperties(geojsonProperties) {
    const positionProperties = getPositionProperties(geojsonProperties);
    const properties = {
      textAnchor: positionProperties.textAnchor,
      textTranslate: positionProperties.textTranslate,
      textJustify: positionProperties.textJustify,
      textField: "{label}",
      textSize: 14,
      textLineHeight: 1.2,
      textColor: "#05032d",
      textHaloColor: "#ffffff",
      textHaloWidth: 2,
      textFont: ["{fontSansMedium}"],
      iconImage: geojsonProperties.type,
      iconSize: 1,
      iconAnchor: "center",
      iconOffset: [0, 0]
    };

    const maxNumberMarker = 20;
    if (
      geojsonProperties.type.includes("number") &&
      geojsonProperties.index <= maxNumberMarker
    ) {
      properties.textField = "";
    } else if (
      geojsonProperties.type.includes("number") &&
      geojsonProperties.index > maxNumberMarker
    ) {
      properties.iconImage = "";
    } else if (geojsonProperties.type === "label") {
      properties.iconImage = "";
      properties.textFont = ["{fontSansLight}"];
    } else if (geojsonProperties.type.includes("arrow")) {
      properties.iconAnchor = positionProperties.textAnchor;
      properties.iconOffset = positionProperties.iconOffset;
    }

    return properties;
  }

  function addFeatures(style, data) {
    const allSymbolIndices = style.layers.reduce((ascending, layer, index) => {
      if (layer.type === "symbol") {
        ascending.push(index);
      }
      return ascending;
    }, []);
    const index = allSymbolIndices[1] || style.layers.length;
    if (data.config.features.type === "vector") {
      style.sources[data.config.features.sourceName] = {
        type: "vector",
        tiles: [
          `${data.config.toolBaseUrl}/tilesets/${data.qId}/${data.config.features.hash}/{z}/{x}/{y}.pbf?appendItemToPayload=${data.qId}`
        ],
        minzoom: 0,
        maxzoom: 14
      };
    }

    data.config.features.linestrings.forEach(feature => {
      const layer = {
        id: feature.id,
        type: "line",
        paint: {
          "line-color": [
            "string",
            ["get", "stroke"],
            data.config.defaultGeojsonStyles.line["stroke"]
          ],
          "line-width": [
            "number",
            ["get", "stroke-width"],
            data.config.defaultGeojsonStyles.line["stroke-width"]
          ],
          "line-opacity": [
            "number",
            ["get", "stroke-opacity"],
            data.config.defaultGeojsonStyles.line["stroke-opacity"]
          ]
        },
        layout: {
          "line-cap": "round",
          "line-join": "round"
        }
      };
      if (data.config.features.type === "vector") {
        layer.source = data.config.features.sourceName;
        layer["source-layer"] = feature.id;
      } else {
        style.sources[feature.id] = {
          type: "geojson",
          data: feature.geojson
        };
        layer.source = feature.id;
      }

      style.layers.splice(index, 0, layer);
    });

    data.config.features.polygons.forEach(feature => {
      const fillLayer = {
        id: feature.id,
        type: "fill",
        paint: {
          "fill-color": [
            "string",
            ["get", "fill"],
            data.config.defaultGeojsonStyles.polygon.fill
          ],
          "fill-opacity": [
            "number",
            ["get", "fill-opacity"],
            data.config.defaultGeojsonStyles.polygon["fill-opacity"]
          ]
        }
      };

      const outlineLayer = {
        id: `outline-${feature.id}`,
        type: "line",
        paint: {
          "line-color": [
            "string",
            ["get", "stroke"],
            data.config.defaultGeojsonStyles.line["stroke"]
          ],
          "line-width": [
            "number",
            ["get", "stroke-width"],
            data.config.defaultGeojsonStyles.polygon["stroke-width"]
          ],
          "line-opacity": [
            "number",
            ["get", "stroke-opacity"],
            data.config.defaultGeojsonStyles.line["stroke-opacity"]
          ]
        }
      };

      if (data.config.features.type === "vector") {
        fillLayer.source = data.config.features.sourceName;
        fillLayer["source-layer"] = feature.id;
        outlineLayer.source = data.config.features.sourceName;
        outlineLayer["source-layer"] = feature.id;
      } else {
        style.sources[feature.id] = {
          type: "geojson",
          data: feature.geojson
        };
        fillLayer.source = feature.id;
        outlineLayer.source = feature.id;
      }

      style.layers.splice(index, 0, fillLayer);
      style.layers.splice(index, 0, outlineLayer);
    });

    data.config.features.points.forEach(feature => {
      const properties = getPointStyleProperties(feature.geojson.properties);
      const layer = {
        id: feature.id,
        type: "symbol",
        layout: {
          "text-field": properties.textField,
          "text-size": properties.textSize,
          "text-line-height": properties.textLineHeight,
          "text-font": properties.textFont,
          "text-anchor": properties.textAnchor,
          "text-justify": properties.textJustify,
          "text-allow-overlap": true,
          "icon-allow-overlap": true,
          "icon-image": properties.iconImage,
          "icon-size": properties.iconSize,
          "icon-anchor": properties.iconAnchor,
          "icon-offset": properties.iconOffset
        },
        paint: {
          "text-translate": properties.textTranslate,
          "text-color": properties.textColor,
          "text-halo-color": properties.textHaloColor,
          "text-halo-width": properties.textHaloWidth
        }
      };

      if (data.config.features.type === "vector") {
        layer.source = data.config.features.sourceName;
        layer["source-layer"] = feature.id;
      } else {
        style.sources[feature.id] = {
          type: "geojson",
          data: feature.geojson
        };
        layer.source = feature.id;
      }
      style.layers.splice(style.layers.length, 0, layer);
    });

    return style;
  }

  function filterByLayer(style, data) {
    const baseLayer = data.options.baseLayer;
    if (
      baseLayer &&
      baseLayer.layers &&
      Object.keys(baseLayer.layers).length > 0
    ) {
      for (let [layer, value] of Object.entries(baseLayer.layers)) {
        if (layer === "label" && !value) {
          style.layers = style.layers.filter(layer => layer.type !== "symbol");
        }
      }
    }
    return style;
  }

  function addHighlightedRegions(style, data) {
    if (
      data.options.highlightRegion &&
      data.options.highlightRegion.length > 0
    ) {
      const highlightRegions = Array.from(
        new Set(data.options.highlightRegion.map(region => region.id))
      );
      for (let highlightRegion of highlightRegions) {
        style.sources[`geodata-${highlightRegion}`] = {
          type: "vector",
          tiles: [
            `${data.config.toolBaseUrl}/geodata/${highlightRegion}/{z}/{x}/{y}.pbf`
          ],
          minzoom: 0,
          maxzoom: 18
        };

        let index = 1;
        if (data.options.baseLayer.style === "satellite") {
          index = style.layers.length;
        }

        style.layers.splice(index, 0, {
          id: `highlightedRegion-${highlightRegion}`,
          type: "fill",
          source: `geodata-${highlightRegion}`,
          "source-layer": `geodata-${highlightRegion}`,
          paint: {
            "fill-color": "#fad250",
            "fill-opacity": 0.4
          }
        });
      }
    }

    return style;
  }
}
