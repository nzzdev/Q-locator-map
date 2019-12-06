const fs = require("fs");
const { geoArea, geoCentroid, geoDistance } = require("d3-geo");
const turf = require("@turf/turf");

function simplifyRegions(features) {
  features.forEach(feature => {
    const { type, coordinates } = feature.geometry;
    if (type === "MultiPolygon") {
      const polygons = coordinates.map(polygonCoordinates => {
        return { type: "Polygon", coordinates: polygonCoordinates };
      });
      const polys = polygons.map(polygon => {
        const clockwisePolygon = turf.rewind(polygon, {
          reverse: true
        });
        const area = geoArea(clockwisePolygon);
        const centroid = geoCentroid(clockwisePolygon);
        return {
          area,
          centroid,
          polygon
        };
      });

      polys.sort((a, b) => b.area - a.area);
      const maxArea = polys[0].area;
      const maxDistance = Math.sqrt(maxArea);
      const mainCentroid = polys[0].centroid;

      const filteredPolygons = polys.filter(({ area, centroid }) => {
        const distanceFromMain = geoDistance(centroid, mainCentroid);
        const relativeDistance = distanceFromMain / maxDistance;
        const relativeSize = area / maxArea;
        return 100 * relativeSize > relativeDistance ** 2;
      });

      feature.geometry.coordinates = filteredPolygons.map(
        ({ polygon }) => polygon.coordinates
      );
    }
  });
}

if (require.main === module) {
  const geojson = JSON.parse(
    fs.readFileSync("data/osm/regions/clipped/US.json")
  );
  // geojson.features = geojson.features.slice(1);
  simplifyRegions(geojson.features);
  fs.writeFileSync(
    "data/osm/test-US-simplified.geojson",
    JSON.stringify(geojson)
  );
}

module.exports = simplifyRegions;
