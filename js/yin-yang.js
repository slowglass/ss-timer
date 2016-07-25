var width = 340;  // window.innerWidth;
var height = 340;  //window.innerHeight;
var padding = 2;
var external_padding = 10;
var yy_r = (Math.min(width, height) - (2 * padding) - external_padding) / 2;
var movable_id = 0;
var big = 0.5 * yy_r;
var small = 0.125 * yy_r;
var NORTH = 0, EAST = 1, SOUTH = 2, WEST = 3;

// Time to complete one transition / iteration 
var timeparam = 10000;


(function() {


var svg = d3.select("#chart").append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")")
    .append("g");

// fixed enclosure
svg.append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r",  yy_r + padding)
    .attr("class", "yin");

function makeArc(sx, sy, rx, ry, x_axis_rotation, 
                 large_arc_flag, sweep_flag, ex, ey) {
    return "M " + sx + "," + sy + 
          " a " + rx + "," + ry + 
          " " + x_axis_rotation + " " + large_arc_flag + 
          " " + sweep_flag + " " + ex + "," + ey + " z";
}

function makeCircle(radius, location, class_name) {
  var cx = -1, cy = -1;

  switch (location) {
    case NORTH:
      cx = 0; cy = -yy_r / 2;
      break;
    case EAST:
      cx = yy_r / 2; cy = 0;
      break;
    case SOUTH:
      cx = 0; cy = yy_r / 2;
      break;
    case WEST:
      cx = -yy_r / 2; cy = 0;
      break;
  }

  return { 
    "movable_id": ++movable_id,
    "cx": cx,
    "cy": cy,
    "r":  radius,
    "class_name": class_name + " movable"
  };
}

var circleData = [
  makeCircle(big, NORTH, "yin"),
  makeCircle(small, NORTH, "yang"),
  makeCircle(big, SOUTH, "yang"),
  makeCircle(small, SOUTH, "yin")
];

var arcData = [
  {
   "movable_id": ++movable_id,
   "path": makeArc(0, yy_r, yy_r, yy_r, 0, 0, 1, 0, -yy_r * 2),
   "class_name": "yang movable arc"
  }
];

var arc = svg.selectAll("path.movable")
  .data(arcData, function(d) { return d.movable_id; })
  .enter()
  .append("path")
  .attr("d", function(d)  { return d.path; })
  .attr("class", function(d)  { return d.class_name; });

var circles = svg.selectAll("circle.movable")
  .data(circleData, function(d) { return d.movable_id; })
  .enter()
  .append("circle")
  .attr("cx", function(d)  { return d.cx; })
  .attr("cy", function(d)  { return d.cy; })
  .attr("r", function(d)  { return d.r; })
  .attr("class", function(d)  { return d.class_name; });

var max_iter = 1;
var iter = 0;
var easeparam = "linear";
function repeat() {
  if (iter >= max_iter) {
    return;
  }
  iter++;
  var d_value = 0;
  circles
    .transition()
    .delay(d_value)
    .duration(timeparam)
    .ease(easeparam)
    .attrTween("transform", transformCircleFn())
    .each("end", repeat);

  arc
    .transition()
    .delay(d_value)
    .duration(timeparam)
    .ease(easeparam)
    .attrTween("transform", transformArcFn())
    .each("end", repeat);
}


function rotStart(t) { return t+90;}

var min_scale = 0.25;
function transformCircleFn() {
  var circleScaleFn = d3.scale.linear()
                    .domain([-1, 1])
                    .range([0, 1]);

  var ratioScaleFn = d3.scale.linear()
                    .domain([-1, 1])
                    .range([min_scale, 2 - min_scale]);
  
  return function(d, i, a) {
    var icx = d.cx;
    var icy = d.cy;
    var radius = d.r;
    var start_angle = Math.atan2(icx, icy);
    var rotation_radius = yy_r / 2;    // console.log("factory params: " + d.cx + ", " + d.cy + ", " + start_angle);

    return function(theta) {
      var t=rotStart(theta);
      var t_angle = (2 * Math.PI) * t + start_angle;

      // scale circles based on current angle
      // sum of radii of opposite inner large circles
      // stays constant and equal to grand radius
      var scale_factor = ratioScaleFn(Math.cos(t_angle));
      var scaleStr =  "scale("+ scale_factor + ")";

      // add an offset to scaled inner circles 
      // to keep them algined and inside grand circle
      var offset = (1 - scale_factor) * 2 * rotation_radius;
      // compensate for SVG coordinate system changes after scaling
      offset = offset  / scale_factor;
      var bx = (offset * Math.cos(t_angle) );
      var by = (offset * Math.sin(t_angle) );
      var translateOffsetStr = "translate(" + bx + "," + by + ")";

      // basic rotation: polar to cartesian transformation
      var ax = (rotation_radius * Math.cos(t_angle) ) - icx;
      var ay = (rotation_radius * Math.sin(t_angle) ) - icy;
      var translateRotationStr = "translate(" + ax + "," + ay + ")";

      // putting it all together
      var transf = [scaleStr, translateOffsetStr, translateRotationStr];
      return transf.join(" ");
    };
  };
}

function transformArcFn() {
  return function(d, i, a) {
    return function(theta) {
      var t=rotStart(theta);
      var r_degrees = 360 * t + 90;
      var rotateStr = "rotate(" + r_degrees + ")";
      return rotateStr;
    };
  };
}

repeat();
})();