const DEG_TO_RAD = Math.PI / 180.0;

function linePointsToRadians(line_pt1, line_pt2) {
  const denom = line_pt1[0] - line_pt2[0];
  if (denom === 0) {
    return Math.PI / 2.0;
  }

  const slope = (line_pt1[1] - line_pt2[1]) / denom;
  return slopeToRadians(slope);
}

function slopeToRadians(slope) {
  return Math.atan(slope);
}

function degreesToRadians(degrees) {
  return degrees * DEG_TO_RAD;
}

function pointAngleRadsAndDistanceFromPoint(start_pt, angle_r, distance) {
  return [start_pt[0] + distance * Math.cos(angle_r), start_pt[1] + distance * Math.sin(angle_r)];
}

function distanceBetweenPoints(point1, point2) {
  return Math.sqrt(Math.pow(point2[0] - point1[0], 2) + Math.pow(point2[1] - point1[1], 2));
}

function center_of_rect(coords) {
  let min_x = 10e10;
  let max_x = 0;
  let min_y = 10e10;
  let max_y = 0;
  for (let coord of coords) {
    if (coord[0] < min_x) {
      min_x = coord[0];
    }
    if (coord[0] > max_x) {
      max_x = coord[0];
    }

    if (coord[1] < min_y) {
      min_y = coord[1];
    }
    if (coord[1] < max_y) {
      max_y = coord[1];
    }
  }
  return [(min_x + max_x) / 2, (min_y + max_y) / 2];
}

function pointsPerpendicularToLine(line_pt1, line_pt2, distance, max_segment_length) {
  const midpoint = [(line_pt2[0] + line_pt1[0]) / 2.0, (line_pt2[1] + line_pt1[1]) / 2.0];
  if (distanceBetweenPoints(line_pt1, line_pt2) > max_segment_length) {
    return pointsPerpendicularToLine(line_pt1, midpoint, distance, max_segment_length)
      .concat(pointsPerpendicularToLine(midpoint, line_pt2, distance, max_segment_length))
  }

  const perpendicular_r = linePointsToRadians(line_pt1, line_pt2) + Math.PI / 2;
  const cos_d = distance * Math.cos(perpendicular_r);
  const sin_d = distance * Math.sin(perpendicular_r);
  const pt1 = [midpoint[0] + cos_d, midpoint[1] + sin_d];
  const pt2 = [midpoint[0] - cos_d, midpoint[1] - sin_d];
  return [[pt1, pt2]];
}

function pointsPerpendicularToAndOutsideOfPolygon(poly_points, distance, max_segment_length = 100) {
  let res_perp_points_arr = [];
  for (let i = 0; i < poly_points.length; i++) {
    const start_pt = poly_points[i];
    const end_pt = i + 1 < poly_points.length ? poly_points[i + 1] : poly_points[0];
    const perp_points = pointsPerpendicularToLine(start_pt, end_pt, distance, max_segment_length);
    res_perp_points_arr = res_perp_points_arr.concat(perp_points)
  }
  return res_perp_points_arr;
}


module.exports = {
  center_of_rect,
  slopeToRadians,
  degreesToRadians,
  pointsPerpendicularToLine,
  pointsPerpendicularToAndOutsideOfPolygon,
  pointAngleRadsAndDistanceFromPoint,
  linePointsToRadians,
  distanceBetweenPoints,
};
