import Sprites from "../resources/sprites/sprites@1x.json";
import turfBBox from "@turf/bbox";
import turfBooleanPointInPolygon from "@turf/boolean-point-in-polygon";
import turfHelpers from "@turf/helpers";

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
}

function applyConfig(style, data) {
  const styleName = data.options.baseLayer.style;
  const fonts = data.config.styleConfig.fonts;
  const colors = data.config.styleConfig.colors[styleName];
  const markers = data.config.styleConfig.markers;
  const highlightRegion = data.config.styleConfig.highlightRegion;

  style = JSON.parse(
    JSON.stringify(style)
      .replace(/"{colorBackground}"/g, JSON.stringify(colors.background))
      .replace(/"{colorWater}"/g, JSON.stringify(colors.water))
      .replace(/"{colorWaterText}"/g, JSON.stringify(colors.waterText))
      .replace(/"{colorWaterway}"/g, JSON.stringify(colors.waterway))
      .replace(/"{colorForest}"/g, JSON.stringify(colors.forest))
      .replace(/"{colorRoad}"/g, JSON.stringify(colors.road))
      .replace(/"{colorRoadText}"/g, JSON.stringify(colors.roadText))
      .replace(/"{colorRailway}"/g, JSON.stringify(colors.railway))
      .replace(/"{colorBuilding}"/g, JSON.stringify(colors.building))
      .replace(/"{colorText}"/g, JSON.stringify(colors.text))
      .replace(
        /"{colorHighlightCountry}"/g,
        JSON.stringify(highlightRegion.highlightCountryColor)
      )
      .replace(
        /"{colorHighlightRegion}"/g,
        JSON.stringify(highlightRegion.highlightRegionColor)
      )
      .replace(/"{textHaloWidth}"/g, JSON.stringify(markers.textHaloWidth))
      .replace(/"{textBlurWidth}"/g, JSON.stringify(markers.textBlurWidth))
      .replace(
        /"{textLetterSpacing}"/g,
        JSON.stringify(markers.textLetterSpacing)
      )
      .replace(/"{textTransform}"/g, JSON.stringify(markers.textTransform))
      .replace(/"{textAnchor}"/g, JSON.stringify(markers.textAnchor))
      .replace(/"{textJustify}"/g, JSON.stringify(markers.textJustify))
      .replace(/"{textOffset}"/g, JSON.stringify(markers.textOffset))
      .replace(/"{iconOffset}"/g, JSON.stringify(markers.iconOffset))
      .replace(/"{iconSize}"/g, JSON.stringify(markers.iconSize))
      .replace(
        /"{textColorIconMarker}"/g,
        JSON.stringify(markers.iconMarker.textColorIconMarker)
      )
      .replace(
        /"{textHaloColorIconMarker}"/g,
        JSON.stringify(markers.iconMarker.textHaloColorIconMarker)
      )
      .replace(
        /"{textSizeIconMarker}"/g,
        JSON.stringify(markers.iconMarker.textSizeIconMarker)
      )
      .replace(
        /"{textSizeCountry}"/g,
        JSON.stringify(markers.country.textSizeCountry)
      )
      .replace(
        /"{textColorCountry}"/g,
        JSON.stringify(markers.country.textColorCountry)
      )
      .replace(
        /"{textTransformCountry}"/g,
        JSON.stringify(markers.country.textTransformCountry)
      )
      .replace(
        /"{textSizeCapital}"/g,
        JSON.stringify(markers.capital.textSizeCapital)
      )
      .replace(
        /"{textTranslateCapital}"/g,
        JSON.stringify(markers.capital.textTranslateCapital)
      )
      .replace(
        /"{iconImageCapital}"/g,
        JSON.stringify(markers.capital.iconImageCapital)
      )
      .replace(/"{textSizeCity}"/g, JSON.stringify(markers.city.textSizeCity))
      .replace(
        /"{textTranslateCity}"/g,
        JSON.stringify(markers.city.textTranslateCity)
      )
      .replace(/"{iconImageCity}"/g, JSON.stringify(markers.city.iconImageCity))
      .replace(
        /"{textTransformLabel}"/g,
        JSON.stringify(markers.label.textTransformLabel)
      )
      .replace(/"{fontSansLight}"/g, JSON.stringify(fonts.fontSansLight.name))
      .replace(
        /"{fontSansRegular}"/g,
        JSON.stringify(fonts.fontSansRegular.name)
      )
      .replace(/"{fontSansMedium}"/g, JSON.stringify(fonts.fontSansMedium.name))
      .replace(
        /"{fontSerifRegular}"/g,
        JSON.stringify(fonts.fontSerifRegular.name)
      )
      .replace(/{styleName}/g, data.options.baseLayer.style)
      .replace(/{fontBaseUrl}/g, fonts.fontBaseUrl)
      .replace(/{fontHash}/g, data.config.fontHash)
      .replace(/{spriteHash}/g, data.config.spriteHash)
      .replace(/{mapboxAccessToken}/g, data.config.mapboxAccessToken)
      .replace(/{toolBaseUrl}/g, data.config.toolBaseUrl)
  );

  if (data.config.tilesets["openmaptiles"]) {
    style = JSON.parse(
      JSON.stringify(style).replace(
        /{openmaptilesHash}/g,
        data.config.tilesets["openmaptiles"].hash
      )
    );
  }
  if (data.config.tilesets["contours"]) {
    style = JSON.parse(
      JSON.stringify(style).replace(
        /{contoursHash}/g,
        data.config.tilesets["contours"].hash
      )
    );
  }
  if (data.config.tilesets["hillshade"]) {
    style = JSON.parse(
      JSON.stringify(style).replace(
        /{hillshadeHash}/g,
        data.config.tilesets["hillshade"].hash
      )
    );
  }
  if (data.config.tilesets["regions"]) {
    style = JSON.parse(
      JSON.stringify(style).replace(
        /{regionsHash}/g,
        data.config.tilesets["regions"].hash
      )
    );
  }

  if (styleName === "basic") {
    style = JSON.parse(
      JSON.stringify(style)
        .replace(
          /"{colorBoundaryCountry}"/g,
          JSON.stringify(colors.boundaryCountry)
        )
        .replace(
          /"{colorBoundaryState}"/g,
          JSON.stringify(colors.boundaryState)
        )
        .replace(
          /"{colorBoundaryCommunity}"/g,
          JSON.stringify(colors.boundaryCommunity)
        )
    );
  } else if (["minimal", "nature", "satellite"].includes(styleName)) {
    style = JSON.parse(
      JSON.stringify(style).replace(
        /"{colorBoundary}"/g,
        JSON.stringify(colors.boundary)
      )
    );
  }
  return style;
}

function getPositionProperties(geojsonProperties, styleConfig) {
  if (
    Sprites[geojsonProperties.type] ||
    ["event", "number"].includes(geojsonProperties.type)
  ) {
    const padding = 2;
    let translateVertical = 0;
    let translateHorizontal = 0;
    let translateFactor = 2;
    let iconOffset = 6 * styleConfig.markers.iconSize;
    let cornerTranslateFactor = 1.4;
    if (geojsonProperties.type === "event") {
      geojsonProperties.type = `arrow-${geojsonProperties.labelPosition}`;
      translateFactor = 1.2;
      cornerTranslateFactor = 1.2;
    } else if (geojsonProperties.type === "number") {
      geojsonProperties.type = `number-${geojsonProperties.index}`;
    }

    if (Sprites[geojsonProperties.type]) {
      const height =
        Sprites[geojsonProperties.type].height * styleConfig.markers.iconSize;
      const width =
        Sprites[geojsonProperties.type].width * styleConfig.markers.iconSize;
      translateVertical = height / translateFactor + padding;
      translateHorizontal = width / translateFactor + 2 * padding;
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

function getIconImage(markerType, styleConfig) {
  if (markerType === "city") {
    return styleConfig.markers.city.iconImageCity;
  } else if (markerType === "capital") {
    return styleConfig.markers.capital.iconImageCapital;
  } else {
    return markerType;
  }
}

function getPointStyleProperties(geojsonProperties, styleConfig) {
  const positionProperties = getPositionProperties(
    geojsonProperties,
    styleConfig
  );
  // default properties
  const properties = {
    textAnchor: positionProperties.textAnchor,
    textTranslate: positionProperties.textTranslate,
    textJustify: positionProperties.textJustify,
    textOffset: "{textOffset}",
    textField: "{label}",
    textSize: "{textSizeIconMarker}",
    textColor: "{textColorIconMarker}",
    textHaloColor: "{textHaloColorIconMarker}",
    textHaloWidth: "{textHaloWidth}",
    textBlurWidth: "{textBlurWidth}",
    textFont: ["{fontSansMedium}"],
    textTransform: "{textTransform}",
    textLetterSpacing: 0,
    iconImage: getIconImage(geojsonProperties.type, styleConfig),
    iconSize: "{iconSize}"
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
  if (["label", "country", "water"].includes(geojsonProperties.type)) {
    properties.iconImage = "";
  }

  // handling of text font
  if (["label", "country"].includes(geojsonProperties.type)) {
    properties.textFont = ["{fontSansLight}"];
  } else if (geojsonProperties.type === "city") {
    properties.textFont = ["{fontSansRegular}"];
  } else if (geojsonProperties.type === "water") {
    properties.textFont = ["{fontSerifRegular}"];
  }

  // handling of text size
  if (geojsonProperties.type === "country") {
    properties.textSize = "{textSizeCountry}";
  } else if (geojsonProperties.type === "capital") {
    properties.textSize = "{textSizeCapital}";
  } else if (["label", "city", "water"].includes(geojsonProperties.type)) {
    properties.textSize = "{textSizeCity}";
  }

  // handling of text color
  if (geojsonProperties.type === "country") {
    properties.textColor = "{textColorCountry}";
    properties.textHaloColor = "{colorBackground}";
  } else if (["label", "capital", "city"].includes(geojsonProperties.type)) {
    properties.textColor = "{colorText}";
    properties.textHaloColor = "{colorBackground}";
  } else if (geojsonProperties.type === "water") {
    properties.textColor = "{colorWaterText}";
    properties.textHaloColor = "{colorWater}";
  }

  // handling of text transforms
  if (geojsonProperties.type === "country") {
    properties.textTransform = "{textTransformCountry}";
  } else if (geojsonProperties.type === "label") {
    properties.textTransform = "{textTransformLabel}";
    properties.textLetterSpacing = "{textLetterSpacing}";
  } else if (geojsonProperties.type === "water") {
    properties.textLetterSpacing = "{textLetterSpacing}";
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
        `{toolBaseUrl}/tilesets/${data.config.features.hash}/${data.qId}/{z}/{x}/{y}.pbf?appendItemToPayload=${data.qId}`
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
          data.config.styleConfig.markers.line.colorLine
        ],
        "line-width": [
          "number",
          ["get", "stroke-width"],
          data.config.styleConfig.markers.line.widthLine
        ],
        "line-opacity": [
          "number",
          ["get", "stroke-opacity"],
          data.config.styleConfig.markers.line.opacityLine
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
          data.config.styleConfig.markers.polygon.fillColorPolygon
        ],
        "fill-opacity": [
          "number",
          ["get", "fill-opacity"],
          data.config.styleConfig.markers.polygon.opacityPolygon
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
          data.config.styleConfig.markers.polygon.fillColorPolygon
        ],
        "line-width": [
          "number",
          ["get", "stroke-width"],
          data.config.styleConfig.markers.polygon.outlineWidthPolygon
        ],
        "line-opacity": [
          "number",
          ["get", "stroke-opacity"],
          data.config.styleConfig.markers.line.opacityLine
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
    const properties = getPointStyleProperties(
      feature.geojson.properties,
      data.config.styleConfig
    );
    const layer = {
      id: feature.id,
      type: "symbol",
      layout: {
        "text-field": properties.textField,
        "text-size": properties.textSize,
        "text-font": properties.textFont,
        "text-anchor": properties.textAnchor,
        "text-justify": properties.textJustify,
        "text-offset": properties.textOffset,
        "text-allow-overlap": true,
        "text-letter-spacing": properties.textLetterSpacing,
        "text-transform": properties.textTransform,
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
        "text-halo-width": properties.textHaloWidth,
        "text-halo-blur": properties.textBlurWidth
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
    if (feature.geojson.properties.type === "country") {
      const highlightedLayer = JSON.parse(JSON.stringify(layer));
      const id = `${highlightedLayer.id}--highlighted`;
      highlightedLayer.id = id;
      highlightedLayer.layout["text-font"] = ["{fontSansMedium}"];
      highlightedLayer.paint["text-halo-color"] = "{colorHighlightCountry}";
      style.layers.splice(style.layers.length, 0, highlightedLayer);
    }
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

export function hasLabels(data) {
  const baseLayer = data.options.baseLayer;
  return baseLayer && baseLayer.layers && baseLayer.layers.label;
}

export function hightlightCountryLabels(map, data) {
  const highlightRegions = Array.from(
    new Set(
      data.options.highlightRegion
        .filter(region => region.id !== "")
        .map(region => region.id)
    )
  );

  // Find labels contained in highlighted regions
  const style = map.getStyle();
  const highlightedLayers = style.layers
    .filter(layer => layer.id.includes("--highlighted"))
    .map(layer => layer.id);
  const highlightedLabels = [];
  for (let highlightRegion of highlightRegions) {
    const relatedSourceFeatures = map.querySourceFeatures("regions", {
      sourceLayer: "countries",
      filter: ["==", "wikidata", highlightRegion]
    });
    if (relatedSourceFeatures.length > 0) {
      const bbox = turfBBox(
        turfHelpers.featureCollection(relatedSourceFeatures)
      );
      const geometry = [
        map.project([bbox[0], bbox[1]]),
        map.project([bbox[2], bbox[3]])
      ];

      let relatedRenderedFeatures = map.queryRenderedFeatures(geometry, {
        layers: highlightedLayers
      });

      relatedRenderedFeatures = relatedRenderedFeatures.filter(
        relatedRenderedFeature => {
          return relatedSourceFeatures.some(relatedSourceFeature =>
            turfBooleanPointInPolygon(
              relatedRenderedFeature,
              relatedSourceFeature
            )
          );
        }
      );
      for (let relatedRenderedFeature of relatedRenderedFeatures) {
        const properties = relatedRenderedFeature.properties;
        if (properties["name:de"]) {
          highlightedLabels.push(properties["name:de"]);
        } else if (properties.label) {
          highlightedLabels.push(properties.label);
        }
      }
    }
  }

  if (highlightedLabels.length > 0) {
    // Apply different style to labels of highlighted regions
    for (let highlightedLayer of highlightedLayers) {
      const layer = highlightedLayer.replace("--highlighted", "");
      const layerFilter = map.getFilter(layer) || ["all"];
      const highlightedLayerFilter = map.getFilter(highlightedLayer) || ["all"];
      const layerLabelFilter = ["any"];
      const highlightedLabelFilter = ["any"];
      for (let highlightedLabel of highlightedLabels) {
        layerLabelFilter.push(["!=", "name:de", highlightedLabel]);
        layerLabelFilter.push(["!=", "label", highlightedLabel]);
        highlightedLabelFilter.push(["==", "name:de", highlightedLabel]);
        highlightedLabelFilter.push(["==", "label", highlightedLabel]);
      }
      layerFilter.push(layerLabelFilter);
      highlightedLayerFilter.push(highlightedLabelFilter);
      map.setFilter(layer, layerFilter);
      map.setFilter(highlightedLayer, highlightedLayerFilter);
    }
  }
}

function addHighlightedRegions(style, data) {
  if (data.options.highlightRegion && data.options.highlightRegion.length > 0) {
    style.sources.regions = {
      type: "vector",
      tiles: [`{toolBaseUrl}/tiles/{regionsHash}/regions/{z}/{x}/{y}.pbf`],
      minzoom: 0,
      maxzoom: 10
    };

    const highlightRegions = Array.from(
      new Set(
        data.options.highlightRegion
          .filter(region => region.id !== "")
          .map(region => region.id)
      )
    );

    for (let highlightRegion of highlightRegions) {
      let index = 1;
      let regionColor = "{colorHighlightCountry}";
      if (data.options.baseLayer.style === "satellite") {
        index = style.layers.length;
        for (let sourceLayer of ["countries", "subdivisions"]) {
          if (sourceLayer === "subdivisions") {
            regionColor = "{colorHighlightRegion}";
          }
          style.layers.splice(index, 0, {
            id: `highlight-${sourceLayer}-${highlightRegion}`,
            type: "line",
            source: "regions",
            "source-layer": sourceLayer,
            filter: ["==", "wikidata", highlightRegion],
            paint: {
              "line-color": regionColor
            }
          });
        }
      } else {
        for (let sourceLayer of ["countries", "subdivisions"]) {
          if (sourceLayer === "subdivisions") {
            regionColor = "{colorHighlightRegion}";
          }
          style.layers.splice(index, 0, {
            id: `highlight-${sourceLayer}-${highlightRegion}`,
            type: "fill",
            source: "regions",
            "source-layer": sourceLayer,
            filter: ["==", "wikidata", highlightRegion],
            paint: {
              "fill-color": regionColor
            }
          });
        }
      }
    }
  }

  return style;
}

export function getBounds(map) {
  let bounds = map.getBounds().toArray();
  return [
    round(bounds[0][0]),
    round(bounds[0][1]),
    round(bounds[1][0]),
    round(bounds[1][1])
  ];
}

function round(value) {
  return Math.round(value * 10000) / 10000;
}
