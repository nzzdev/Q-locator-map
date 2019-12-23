import Sprites from "../resources/sprites/sprites@1x.json";

export function getStyle(data) {
  return fetch(
    `${data.toolBaseUrl}/styles/${data.options.baseLayer.style}?toolBaseUrl=${data.toolBaseUrl}`
  )
    .then(response => {
      if (response.ok) {
        return response.json();
      }
    })
    .then(style => {
      style = applyStyleConfig(style, data);
      style = filterByLayer(style, data);
      style = addHighlightedRegions(style, data);
      style = addFeatures(style, data);
      return style;
    });

  function applyStyleConfig(style, data) {
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
    // default properties
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
      textFont: ["GT America Standard Medium"],
      iconImage: geojsonProperties.type,
      iconSize: 1,
      iconAnchor: "center",
      iconOffset: [0, 0]
    };

    // special properties handling

    // handling of labels below map
    if (geojsonProperties.type.includes("number")) {
      const maxNumberMarker = 20;
      if (geojsonProperties.index <= maxNumberMarker) {
        properties.textField = "";
      } else if (geojsonProperties.index > maxNumberMarker) {
        properties.iconImage = "";
      }
    }

    // handling of marker types without icon
    if (
      ["label", "country", "capital", "city", "water"].includes(
        geojsonProperties.type
      )
    ) {
      properties.iconImage = "";
    }

    // handling of text font
    if (["label", "country"].includes(geojsonProperties.type)) {
      properties.textFont = ["GT America Standard Light"];
    } else if (geojsonProperties.type === "city") {
      properties.textFont = ["GT America Standard Regular"];
    } else if (geojsonProperties.type === "water") {
      properties.textFont = ["Pensum Pro Regular Italic"];
    }

    // handling of text size
    if (["city", "water"].includes(geojsonProperties.type)) {
      properties.textSize = 13;
    } else if (geojsonProperties.type === "capital") {
      properties.textSize = 15;
    }

    // handling of text color
    if (geojsonProperties.type === "country") {
      properties.textColor = "#6e6e7e";
    } else if (["capital", "city"].includes(geojsonProperties.type)) {
      properties.textColor = "#92929e";
    } else if (geojsonProperties.type === "water") {
      properties.textColor = "#0093bf";
    }

    // handling of text halo
    if (geojsonProperties.type === "water") {
      properties.textHaloColor = "#cee9f2";
    }

    // handling of icon properties for arrow marker type
    if (geojsonProperties.type.includes("arrow")) {
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
          `${data.toolBaseUrl}/tilesets/${data.qId}/${data.config.features.hash}/{z}/{x}/{y}.pbf?appendItemToPayload=${data.qId}`
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
            `${data.toolBaseUrl}/geodata/${highlightRegion}/{z}/{x}/{y}.pbf`
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
