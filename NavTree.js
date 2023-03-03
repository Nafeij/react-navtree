'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NavTree = function () {
  function NavTree(id) {
    _classCallCheck(this, NavTree);

    this.id = id || null;
    this.parent = null;
    this.nodes = {};
    this.nodesId = []; // array of nodes ID to keep the order they are added
    this.focusedNode = null;

    this.onNavCallback = null;
    this.resolveFunc = null;
  }

  /**
   * Add child node
   * @param id
   * @returns {NavTree}
   */


  _createClass(NavTree, [{
    key: 'addNode',
    value: function addNode(id) {
      if (!id) {
        id = this._genId();
      } else {
        if (this.nodes[id] !== undefined) {
          // `id` is taken
          if (process.env.NODE_ENV !== 'production') {
            console.warn('NavTree.addNode() - duplicated ID:', id);
          }
          id = this._genId();
        }
      }

      var child = new this.constructor(id);
      child.parent = this;

      this.nodes[id] = child;
      this.nodesId.push(id);

      return child;
    }

    /**
     * Remove child node
     * @param id
     */

  }, {
    key: 'removeNode',
    value: function removeNode(id) {
      if (this.focusedNode === id) {
        this.focusedNode = null;
      }

      this.nodes[id].parent = null;

      delete this.nodes[id];
      this.nodesId.splice(this.nodesId.indexOf(id), 1);
    }

    /**
     * Find available node ID
     * @returns {string}
     * @private
     */

  }, {
    key: '_genId',
    value: function _genId() {
      // use the first available numeric `id`
      var id = this.nodesId.length + 1;
      while (this.nodes[id]) {
        id++;
      }
      return id.toString();
    }

    /**
     * Focus a node specified by path (or itself if path is omitted or empty)
     * @param path - array or a list or arguments, e.g. focus(['a', 'b']) or focus('a', 'b')
     */

  }, {
    key: 'focus',
    value: function focus(path) {
      if (Array.isArray(path)) {
        path = path.slice();
      } else {
        path = [].slice.call(arguments);
      }

      // get the root node and full path to the target node
      var node = this;
      while (node.parent) {
        path.unshift(node.id);
        node = node.parent;
      }

      node._focus(path);
    }

    /**
     * Focus a node specified by path. Must be called on root instance.
     * @param path {Array|false}
     * @private
     */

  }, {
    key: '_focus',
    value: function _focus(path) {
      // `onNav` event
      if (this.onNavCallback) {
        this.onNavCallback(path === false ? false : path.slice());
      }

      var newFocusedNode = void 0;

      if (path === false) {
        newFocusedNode = null;
      } else {
        newFocusedNode = path.length > 0 ? path.shift() : null;
      }

      // wrong node ID
      if (newFocusedNode !== null && this.nodes[newFocusedNode] === undefined) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('trying to focus invalid ID', newFocusedNode);
        }
        return;
      }

      // revoke focus from previously focused node
      if (this.focusedNode !== null && this.focusedNode !== newFocusedNode) {
        this.nodes[this.focusedNode]._focus(false); // revoke focus recursively
      }

      this.focusedNode = newFocusedNode;

      // focus
      if (newFocusedNode !== null) {
        this.nodes[newFocusedNode]._focus(path); // focus down the path recursively
      }
    }

    /**
     * Resolve an event to a node that should be focused next.
     * @param event
     * @returns {NavTree|false}
     */

  }, {
    key: 'resolve',
    value: function resolve(event) {
      var node = this;

      // get the root node
      while (node.parent) {
        node = node.parent;
      }
      var rootNode = node;

      // intercept `focus()` call during resolving process
      var ctrl = { break: false };
      var originalFocusFunc = rootNode._focus;
      rootNode._focus = function (path) {
        ctrl.break = true;
        return originalFocusFunc.call(rootNode, path);
      };

      // resolving
      var targetNode = rootNode._resolve(event, ctrl);

      rootNode._focus = originalFocusFunc;

      if (targetNode && !ctrl.break && rootNode !== targetNode) {
        targetNode.focus(); // focus resolved node
        return targetNode;
      } else {
        return false;
      }
    }

    /**
     * Resolve an event to a node that should be focused next. Must be called on root instance.
     * @param event
     * @param ctrl {{break: boolean}} - flag to stop the process (set to true if `focus()` gets called during resolving process)
     * @returns {NavTree|false}
     * @private
     */

  }, {
    key: '_resolve',
    value: function _resolve(event, ctrl) {
      var deepestFocusedNode = this.getFocusedNode(true) || this;
      var node = deepestFocusedNode;

      //
      // Phase 1
      // Traversing up the tree (up the focused path) until the event is resolved, starting from the deepest focused node
      //
      do {
        var resolvedNode = this._getResolveFuncResult(node, event, deepestFocusedNode);
        if (ctrl.break) return false;

        if (resolvedNode) {
          if (resolvedNode === node) {
            return node;
          }
          node = resolvedNode;
          break; // move to phase 2
        } else {
          node = node.parent; // traversing up the tree until the event is resolved
        }
      } while (node);

      if (!node) return false; // the event couldn't be resolved
      if (node.parent && node.parent.focusedNode === node.id) return node; // phase 2 is redundant if `node` is focused

      //
      // Phase 2
      // Traversing down the tree as long as the event is resolved, starting from the last node from phase 1
      //
      while (true) {
        var _resolvedNode = this._getResolveFuncResult(node, event, deepestFocusedNode);
        if (ctrl.break) return false;

        if (_resolvedNode) {
          if (_resolvedNode === node) {
            return node;
          }

          node = _resolvedNode; // traversing down the tree as long as the event is resolved
        } else {
          return node;
        }
      }
    }

    /**
     * Get a node returned by the resolve function
     * @param node {NavTree}
     * @param event
     * @param deepestFocusedNode {NavTree}
     * @returns {NavTree|null}
     * @private
     */

  }, {
    key: '_getResolveFuncResult',
    value: function _getResolveFuncResult(node, event, deepestFocusedNode) {
      var resolveFuncResult = node.resolveFunc(event, node, deepestFocusedNode);

      if (resolveFuncResult === null) {
        return node;
      } else if (node.nodes[resolveFuncResult] !== undefined) {
        return node.nodes[resolveFuncResult];
      } else {
        return null;
      }
    }

    /**
     * Get descendant node specified by path (or itself if path is empty or omitted)
     * @param path - array or a list of arguments
     * @returns {NavTree|null}
     */

  }, {
    key: 'getNode',
    value: function getNode(path) {
      if (!Array.isArray(path)) {
        path = [].slice.call(arguments);
      }

      var node = this;
      for (var i in path) {
        node = node.nodes[path[i]];
        if (!node) return null;
      }
      return node;
    }

    /**
     * Get path to the deepest focused node
     * @returns {Array<string>}
     */

  }, {
    key: 'getFocusedPath',
    value: function getFocusedPath() {
      var path = [];
      var node = this;
      while (node.focusedNode !== null) {
        path.push(node.focusedNode);
        node = node.nodes[node.focusedNode];
      }
      return path;
    }

    /**
     * Get the focused node
     * @param deep {boolean} get the deepest focused node
     * @returns {NavTree|null}
     */

  }, {
    key: 'getFocusedNode',
    value: function getFocusedNode(deep) {
      var node = this.nodes[this.focusedNode];

      if (!deep || !node) return node || null;

      while (node.focusedNode !== null) {
        node = node.nodes[node.focusedNode];
      }
      return node;
    }
  }]);

  return NavTree;
}();

exports.default = NavTree;