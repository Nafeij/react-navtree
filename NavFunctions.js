'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.navDynamic = navDynamic;
exports.navTable = navTable;
//
// Dynamic navigation
// (elements' position evaluated at run-time)
//

/**
 * Get element position
 * @param el
 * @returns {ClientRect|null}
 */
var getElRect = function getElRect(el) {
  var rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null; // element is not visible
  return rect;
};

/**
 * Get center point of a rectangle. The points are used to compare distance between elements.
 *          up
 *      ┌────*────┐
 *      │         │
 * left *         * right
 *      │         │
 *      └────*────┘
 *          down
 *
 * @param side
 * @param rect {ClientRect}
 * @returns {{x, y}}
 */
var getCenterPoint = function getCenterPoint(side, rect) {
  if (side === 'left') return { x: rect.left, y: rect.top + (rect.bottom - rect.top) / 2 };else if (side === 'right') return { x: rect.right, y: rect.top + (rect.bottom - rect.top) / 2 };else if (side === 'up') return { x: rect.left + (rect.right - rect.left) / 2, y: rect.top };else if (side === 'down') return { x: rect.left + (rect.right - rect.left) / 2, y: rect.bottom };
};

/**
 * Calculate distance between two points
 * @param pos1 {{x, y}}
 * @param pos2 {{x, y}}
 * @returns {number}
 */
var getDistance = function getDistance(pos1, pos2) {
  var a = pos1.x - pos2.x;
  var b = pos1.y - pos2.y;

  return Math.sqrt(a * a + b * b);
};

var invertKey = { left: 'right', right: 'left', up: 'down', down: 'up'

  /**
   *
   */
};function navDynamic(key, navTree, deepestFocusedNode) {
  if (key !== 'left' && key !== 'right' && key !== 'up' && key !== 'down') return false;

  var srcEl = void 0;
  if (navTree.focusedNode !== null) {
    srcEl = navTree.nodes[navTree.focusedNode].el;
  } else if (deepestFocusedNode) {
    srcEl = deepestFocusedNode.el;
  }

  // get src element position
  var srcRect = void 0;
  var srcPoint = void 0;
  if (srcEl && (srcRect = getElRect(srcEl))) {
    srcPoint = getCenterPoint(key, srcRect);
  } else {
    // no element, or not visible
    srcPoint = { x: 0, y: 0 };
  }

  var minDistance = null;
  var minDistanceNode = void 0;

  // Loop over child nodes to find a node that is at minimum distance from previously focused element
  navTree.nodesId.forEach(function (id) {
    var dstNode = navTree.nodes[id];
    var dstEl = dstNode.el;
    if (dstEl === srcEl) return;

    // get dst element position
    var dstRect = getElRect(dstEl);
    if (!dstRect) return; // element is not visible, skip
    var dstPoint = getCenterPoint(invertKey[key], dstRect);

    // skip if element is beyond the scope
    if (key === 'left' && dstPoint.x > srcPoint.x || key === 'right' && dstPoint.x < srcPoint.x || key === 'up' && dstPoint.y > srcPoint.y || key === 'down' && dstPoint.y < srcPoint.y) return;

    var distance = getDistance(srcPoint, dstPoint);

    if (minDistance === null || minDistance > distance) {
      minDistance = distance;
      minDistanceNode = dstNode;
    }
  });

  return minDistanceNode ? minDistanceNode.id : false;
}

//
// Fixed (static) navigation
//

var getValue = function getValue(val, values, dir) {
  var pos = values.indexOf(val);

  var shiftPos = dir === 'next' ? 1 : -1;

  var newPos = void 0;

  if (pos === -1) {
    newPos = shiftPos > 0 ? 0 : values.length - 1;
  } else {
    newPos = pos + shiftPos;
  }

  if (newPos >= 0 && newPos < values.length) {
    return values[newPos];
  } else {
    return false;
  }
};

/**
 * Vertical row resolve function ('up' and 'down' keys)
 */
var navVertical = exports.navVertical = function navVertical(key, navTree) {
  var focusedNode = navTree.focusedNode,
      nodesId = navTree.nodesId;


  if (key === 'up' || key === 'down') {
    return getValue(focusedNode, nodesId, key === 'up' ? 'prev' : 'next');
  } else {
    return focusedNode !== null ? false : nodesId[0];
  }
};

/**
 * Horizontal row resolve function ('left' and 'right' keys)
 */
var navHorizontal = exports.navHorizontal = function navHorizontal(key, navTree) {
  var focusedNode = navTree.focusedNode,
      nodesId = navTree.nodesId;


  if (key === 'left' || key === 'right') {
    return getValue(focusedNode, nodesId, key === 'left' ? 'prev' : 'next');
  } else {
    return focusedNode !== null ? false : nodesId[0];
  }
};

/**
 * Table (fixed columns size) resolve function ('left' 'right', 'up', 'down' keys)
 * @param cols
 * @returns {Function}
 */
function navTable(_ref) {
  var cols = _ref.cols;

  return function (key, navTree) {
    var focusedNode = navTree.focusedNode,
        nodesId = navTree.nodesId;


    var pos = focusedNode !== null ? nodesId.indexOf(focusedNode) : -1;

    if (key === 'left' || key === 'right') {
      var rowNum = pos !== -1 ? Math.floor(pos / cols) : 0;
      var rowStartIndex = rowNum * cols;
      var rowEndIndex = rowStartIndex + cols;
      var rowNodes = nodesId.slice(rowStartIndex, rowEndIndex);

      return getValue(focusedNode, rowNodes, key === 'left' ? 'prev' : 'next');
    } else if (key === 'up' || key === 'down') {
      var colNum = pos !== -1 ? pos % cols : 0;
      var colNodes = [];

      for (var i = colNum; i < nodesId.length; i += cols) {
        colNodes.push(nodesId[i]);
      }

      return getValue(focusedNode, colNodes, key === 'up' ? 'prev' : 'next');
    }
  };
}