import numpy as np
import math
import cv2


def get_center_of_rect(coords):
    x_vals = [coord[0] for coord in coords]
    y_vals = [coord[1] for coord in coords]
    min_x = min(x_vals)
    max_x = max(x_vals)
    min_y = min(y_vals)
    max_y = max(y_vals)
    return (min_x + max_x) / 2, (min_y + max_y) / 2


def slopeToRadians(slope):
    return math.atan(slope)


def distanceBetweenPoints(point1, point2):
    return math.sqrt(math.pow(point2[0] - point1[0], 2) + math.pow(point2[1] - point1[1], 2))


def pointsPerpendicularToLine(line_pt1, line_pt2, distance, max_segment_length=100):
    midpoint = [(line_pt2[0] + line_pt1[0]) / 2.0, (line_pt2[1] + line_pt1[1]) / 2.0]
    if distanceBetweenPoints(line_pt1, line_pt2) > max_segment_length:
        return pointsPerpendicularToLine(line_pt1, midpoint, distance, max_segment_length) \
               + pointsPerpendicularToLine(midpoint, line_pt2, distance, max_segment_length)

    perpendicular_r = linePointsToRadians(line_pt1, line_pt2) + math.pi / 2
    cos_d = distance * math.cos(perpendicular_r)
    sin_d = distance * math.sin(perpendicular_r)
    pt1 = [midpoint[0] + cos_d, midpoint[1] + sin_d]
    pt2 = [midpoint[0] - cos_d, midpoint[1] - sin_d]
    return [[pt1, pt2]]


def pointAngleRadsAndDistanceFromPoint(start_pt, angle_r, distance):
    return [start_pt[0] + distance * math.cos(angle_r), start_pt[1] + distance * math.sin(angle_r)]


def pointsPerpendicularToAndOutsideOfPolygon(poly_points, distance, max_segment_length=100):
    res_perp_points_arr = []
    for i in range(0, len(poly_points)):
        start_pt = poly_points[i]
        end_pt = poly_points[i + 1] if i + 1 < len(poly_points) else poly_points[0]
        perp_points = pointsPerpendicularToLine(start_pt, end_pt, distance, max_segment_length)
        res_perp_points_arr = res_perp_points_arr + perp_points

    return res_perp_points_arr


def linePointsToRadians(line_pt1, line_pt2):
    denom = line_pt1[0] - line_pt2[0]
    if denom == 0:
        return math.pi / 2

    slope = (line_pt1[1] - line_pt2[1]) / denom
    return slopeToRadians(slope)


def spawnTilesAroundPolygon(polygon):
    center = get_center_of_rect(polygon)

    perp_point_lines = pointsPerpendicularToAndOutsideOfPolygon(polygon, 20, 30)
    result = []
    for perp_points in perp_point_lines:
        if distanceBetweenPoints(perp_points[0], center) > distanceBetweenPoints(perp_points[1], center):
            angle_r = linePointsToRadians(perp_points[1], perp_points[0])
            result.append([perp_points[0], perp_points[1], angle_r])
        else:
            angle_r = linePointsToRadians(perp_points[1], perp_points[0])
            result.append([perp_points[1], perp_points[0], angle_r])

    return result


img = np.zeros((800, 800, 3))

polygon = np.array([[350, 150], [650, 150], [650, 450], [350, 450]], np.int32)
center = get_center_of_rect(polygon)
print(center)

img = cv2.polylines(img, [polygon.reshape((-1, 1, 2))], True, (0, 255, 255))

for i in range(0, len(polygon)):
    start_pt = polygon[i]
    end_pt = polygon[i + 1] if i + 1 < len(polygon) else polygon[0]
    for ppt1, ppt2 in pointsPerpendicularToLine(start_pt, end_pt, 20, 30):
        img = cv2.line(img, tuple(np.array(ppt1, np.int32)), tuple(np.array(ppt2, np.int32)), (0, 255, 0))
        # ppt1 is further away, so its green
        # if distanceBetweenPoints(ppt1, center) > distanceBetweenPoints(ppt2, center):
        #    img = cv2.circle(img, tuple(np.array(ppt1, np.int32)), 10, (0, 255, 0))
        #    img = cv2.circle(img, tuple(np.array(ppt2, np.int32)), 10, (0, 0, 255))
        # else:
        #    img = cv2.circle(img, tuple(np.array(ppt2, np.int32)), 10, (0, 255, 0))
        #    img = cv2.circle(img, tuple(np.array(ppt1, np.int32)), 10, (0, 0, 255))

node_res = spawnTilesAroundPolygon(polygon)
print(node_res)
for pt1, pt2, angle_r in node_res:
    img = cv2.line(img, tuple(np.array(pt1, np.int32)), tuple(np.array(pt2, np.int32)), (255, 0, 255))

    img = cv2.circle(img, tuple(np.array(pt1, np.int32)), 10, (0, 255, 0))
    img = cv2.circle(img, tuple(np.array(pt2, np.int32)), 10, (0, 0, 255))

    x2 = pt1[0] + 10 * math.cos(angle_r)
    y2 = pt1[1] + 10 * math.sin(angle_r)

    img = cv2.line(img, tuple(np.array(pt1, np.int32)), tuple(np.array([x2, y2], np.int32)), (255, 255, 255))

cv2.imshow('image', img)

cv2.waitKey(0)
