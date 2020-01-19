function slopeToRadians(slope) {
  return Math.atan(slope);
}

function pointsPerpendicularToMidpointOfLine(line_pt1, line_pt2, distance) {
  const midpoint = [(line_pt2[0] + line_pt1[0]) / 2.0, (line_pt2[1] + line_pt1[1]) / 2.0];
  const original_slope = (line_pt1[1] - line_pt2[1]) / (line_pt1[0] - line_pt2[0])
  const perpendicular_r = slopeToRadians(original_slope) + Math.PI / 2;

  const cos_d = distance * Math.cos(perpendicular_r);
  const sin_d = distance * Math.sin(perpendicular_r);
  const pt1 = [midpoint[0] + cos_d, midpoint[1] + sin_d];
  const pt2 = [midpoint[0] - cos_d, midpoint[1] - sin_d];
  return [pt1, pt2];
}

function pointsPerpendicularToLineMidpointsOfPolygon(poly_points, distance) {
  const perp_points_arr = []
  for (let i = 0; i < poly_points.length; i++) {
    const start_pt = poly_points[i];
    const end_pt = i + 1 < poly_points.length ? poly_points[i + 1] : poly_points[0];
    const perp_points = pointsPerpendicularToMidpointOfLine(start_pt, end_pt, distance);
    perp_points_arr.push(perp_points)
  }
  return perp_points_arr
}


module.exports = {
  slopeToRadians,
  pointsPerpendicularToMidpointOfLine,
  pointsPerpendicularToLineMidpointsOfPolygon,
};
