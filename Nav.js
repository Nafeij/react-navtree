'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _NavTree = require('./NavTree');

var _NavTree2 = _interopRequireDefault(_NavTree);

var _NavFunctions = require('./NavFunctions');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var Nav = (0, _react.memo)(function Nav(props) {
  var _this = this;

  var _useState = (0, _react.useState)(false),
      _useState2 = _slicedToArray(_useState, 2),
      focused = _useState2[0],
      setFocused = _useState2[1];

  var _tree = (0, _react.useRef)(null);

  (0, _react.useEffect)(function () {
    if (props.tree) {
      _tree = props.tree;
    } else if ((0, _react.useContext)(_NavTree2.default)) {
      var id = props.navId;
      _tree = (0, _react.useContext)(_NavTree2.default).addNode(id);
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('No navigation tree provided. `NavTree` instance should be passed as a `tree` prop to the root (top level) `Nav` component');
      }
      return;
    }

    _tree.resolveFunc = resolveFunc.bind(_this);
    _tree.onNavCallback = _onNav.bind(_this);

    if (props.defaultFocused) {
      _tree.focus();
    }

    return function () {
      if (_tree.parent) {
        _tree.parent.removeNode(_tree.id);
      }
    };
  }, []);

  var resolveFunc = function resolveFunc(event, navTree, focusedNode) {
    if (!props.func) {
      if (navTree.nodesId.length > 1) return (0, _NavFunctions.navDynamic)(event, navTree, focusedNode);else return focused ? false : navTree.nodesId.length > 0 ? navTree.nodesId[0] : null;
    } else {
      return props.func(event, navTree, focusedNode);
    }
  };

  var _onNav = function _onNav(path) {
    setFocused(path !== false);

    if (props.onNav) {
      props.onNav(path);
    }
  };

  var Component = props.component,
      children = props.children,
      className = props.className,
      focusedClass = props.focusedClass,
      tree = props.tree,
      navId = props.navId,
      func = props.func,
      onNav = props.onNav,
      defaultFocused = props.defaultFocused,
      restProps = _objectWithoutProperties(props, ['component', 'children', 'className', 'focusedClass', 'tree', 'navId', 'func', 'onNav', 'defaultFocused']);

  if (focused) {
    className += ' ' + focusedClass;
  }

  return _react2.default.createElement(
    Component,
    _extends({ ref: function ref(_ref) {
        if (_tree) _tree.el = _ref;
      }, className: className }, restProps),
    children
  );
});

Nav.contextTypes = {
  tree: _propTypes2.default.instanceOf(_NavTree2.default)
};

Nav.childContextTypes = {
  tree: _propTypes2.default.instanceOf(_NavTree2.default)
};

Nav.propTypes = {
  navId: _propTypes2.default.string,
  func: _propTypes2.default.func,
  focusedClass: _propTypes2.default.string,
  component: _propTypes2.default.oneOfType([_propTypes2.default.func, _propTypes2.default.string]),
  tree: _propTypes2.default.instanceOf(_NavTree2.default),
  onNav: _propTypes2.default.func,
  defaultFocused: _propTypes2.default.bool,
  children: _propTypes2.default.node,
  className: _propTypes2.default.string
};

Nav.defaultProps = {
  component: 'div',
  focusedClass: 'nav-focused',
  className: ''
};

exports.default = Nav;