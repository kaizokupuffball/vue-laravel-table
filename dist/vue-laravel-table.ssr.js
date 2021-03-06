'use strict';Object.defineProperty(exports,'__esModule',{value:true});var _=require('lodash');function _interopDefaultLegacy(e){return e&&typeof e==='object'&&'default'in e?e:{'default':e}}var ___default=/*#__PURE__*/_interopDefaultLegacy(_);function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

  return arr2;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}var script = {
  /**
   * Component name
   */
  name: 'vue-laravel-table',

  /**
   * Props
   */
  props: {
    laravelDataUrl: {
      type: String,
      required: true
    },
    laravelDataResource: {
      type: Object,
      required: true
    },
    hideColumns: {
      type: Array,
      required: false,
      default: []
    },
    showActions: {
      type: Array,
      required: false,
      default: []
    },
    showActionIcons: {
      type: Boolean,
      required: false
    },
    csrfToken: {
      type: String,
      required: false
    },
    searchableColumns: {
      type: Array,
      required: false,
      default: []
    },
    showPerPage: {
      type: Boolean,
      required: false
    },
    orderableColumns: {
      type: Array,
      required: false
    }
  },
  data: function data() {
    return {
      laravelData: {},
      tableHeaders: [],
      loading: false,
      acceptedActions: ['create', 'edit', 'show', 'delete'],
      searchQuery: '',
      currentPage: 1,
      perPage: 25,
      orderBy: {
        direction: false,
        column: false
      }
    };
  },
  mounted: function mounted() {
    this.getResults();
  },
  computed: {
    /**
     * Table headers are computed, since they will not likey change
     * ever because they are the keys of the database table that we
     * get the data from
     */
    generateTableHeaders: function generateTableHeaders() {
      var headers = [];

      if (this.laravelData.total > 0) {
        for (var _i = 0, _Object$entries = Object.entries(this.laravelData.data[0]); _i < _Object$entries.length; _i++) {
          var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
              k = _Object$entries$_i[0],
              v = _Object$entries$_i[1];

          if (!this.hideColumns.includes(k)) {
            var obj = {};
            obj[k] = this.formatHeader(k);
            headers.push(obj);
          }
        }

        if (this.showActions.length) {
          var obj = {};
          obj['actions'] = this.formatHeader('actions');
        }

        headers.push(obj);
        return headers;
      }
    }
  },
  watch: {
    /**
     * searchQuery are being watched for changes,
     * so everytime the search query changes, the "search" method
     * is run. There is debouncing on this with 300ms
     */
    searchQuery: ___default['default'].debounce(function (v) {
      this.search(v);
    }, 300),

    /**
     * Just update the perPage number
     * when the user selected another than the default
     */
    perPage: function perPage(v) {
      this.changePerPage(v);
    }
  },
  methods: {
    /**
     * Order toggling based on column key and 
     * order direction (asc, desc)
     */
    toggleOrder: function toggleOrder(event, key) {
      event.preventDefault();

      if (this.orderBy.direction == false || this.orderBy.column != key) {
        this.orderBy.direction = 'asc';
        this.orderBy.column = key;
      } else if (this.orderBy.direction == 'asc') {
        this.orderBy.direction = 'desc';
        this.orderBy.column = key;
      } else if (this.orderBy.direction == 'desc') {
        this.orderBy.direction = false;
        this.orderBy.column = false;
      }

      this.getResults(this.searchQuery);
    },

    /**
     * Search function
     */
    search: function search(q) {
      this.currentPage = 1;
      this.getResults(q);
    },

    /**
     * Simple pagination based on what link got clicked in the pagination
     * elements.. Search query are also beeing added to the URL if there
     * has been a search
     */
    paginate: function paginate(event) {
      event.preventDefault();
      var url = new URL(event.target.getAttribute('data-href'));
      this.currentPage = url.searchParams.get('page');
      this.getResults(this.searchQuery);
    },

    /**
     * When the user changes the items per page, the table refreshes
     */
    changePerPage: function changePerPage(itemsPerPage) {
      this.currentPage = 1;
      this.getResults(this.searchQuery);
    },
    getResults: function getResults() {
      var _this = this;

      var searchQuery = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      // Start loading spinner
      this.loading = true; // Prepare the URL

      var url = new URL(this.laravelDataUrl);
      url.searchParams.set('page', this.currentPage); // Add search parameters if there exists a search

      if (searchQuery !== false && searchQuery.length) {
        url.searchParams.set('q', searchQuery);
        url.searchParams.set('qC', this.searchableColumns);
      } // Add order parameters if they exist


      if (this.orderBy.column != false || this.orderBy.direction != false) {
        url.searchParams.set('orderBy', this.orderBy.column);
        url.searchParams.set('orderDirection', this.orderBy.direction);
      } // Add perPage parameters


      url.searchParams.set('perPage', this.perPage);
      axios.get(url).then(function (response) {
        _this.laravelData = response.data;
        _this.tableHeaders = _this.generateTableHeaders;
        _this.loading = false;
      }).catch(function (error) {
        throw new Error(error);
      });
    },

    /**
     * Simple header formating
     * Capitalizing and removing underscores that may
     * come from the laravel data object (database column names)
     */
    formatHeader: function formatHeader(str) {
      return (str[0].toUpperCase() + str.slice(1)).replace(/_/g, ' ');
    },

    /**
     * This generates the row actions, 
     * only show, edit and delete actions
     * and not the create action because that is not
     * placed in a table row, rather at the top of the table
     */
    generateRowActions: function generateRowActions(id) {
      var generatedActions = [];

      for (var _i2 = 0, _Object$entries2 = Object.entries(this.showActions); _i2 < _Object$entries2.length; _i2++) {
        var _Object$entries2$_i = _slicedToArray(_Object$entries2[_i2], 2),
            k = _Object$entries2$_i[0],
            v = _Object$entries2$_i[1];

        this.acceptedActions.includes(v) && v != 'create' && generatedActions.push(_defineProperty({}, v, this.generateActionHtml(v, this.csrfToken, id)));
      }

      return generatedActions;
    },

    /**
     * Simply generates a create button based on
     * the data resource passed with props
     */
    generateCreateButton: function generateCreateButton() {
      return this.generateActionHtml('create');
    },

    /**
     * Generates actions based on what kind of type it is
     * For now, one can generate links for create, edit, and show model
     * and generate a create model button/link
     */
    generateActionHtml: function generateActionHtml(type, csrf) {
      var id = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      var html = '';
      var url = this.laravelDataResource.prefix ? '/' + this.laravelDataResource.prefix + '/' + this.laravelDataResource.name + '/' : '/' + this.laravelDataResource.name + '/';

      switch (type) {
        case 'create':
          var iconOrText = this.showActionIcons ? '<i class="fas fa-fw fa-plus"></i>' : 'Create';
          html = '<a class="action-link btn btn-primary" href="' + url + 'create">' + iconOrText + '</a>';
          break;

        case 'edit':
          var iconOrText = this.showActionIcons ? '<i class="fas fa-fw fa-edit"></i>' : 'Edit';
          html = '<a class="action-link" href="' + url + id + '/edit">' + iconOrText + '</a>';
          break;

        case 'show':
          var iconOrText = this.showActionIcons ? '<i class="fas fa-fw fa-eye"></i>' : 'Show';
          html = '<a class="action-link" href="' + url + id + '">' + iconOrText + '</a>';
          break;

        case 'delete':
          var iconOrText = this.showActionIcons ? '<i class="fas fa-fw fa-trash"></i>' : 'Delete';
          html = '<form class="action-form" method="post" action="' + url + id + '">' + '<input type="hidden" name="_token" value="' + csrf + '">' + '<input type="hidden" name="_method" value="DELETE">' + '<button class="btn btn-link text-danger" type="submit">' + iconOrText + '</button>' + '</form>';
          break;
      }

      return html;
    }
  }
};function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
        createInjectorSSR = createInjector;
        createInjector = shadowMode;
        shadowMode = false;
    }
    // Vue.extend constructor export interop.
    const options = typeof script === 'function' ? script.options : script;
    // render functions
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true;
        // functional template
        if (isFunctionalTemplate) {
            options.functional = true;
        }
    }
    // scopedId
    if (scopeId) {
        options._scopeId = scopeId;
    }
    let hook;
    if (moduleIdentifier) {
        // server build
        hook = function (context) {
            // 2.3 injection
            context =
                context || // cached call
                    (this.$vnode && this.$vnode.ssrContext) || // stateful
                    (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
            // 2.2 with runInNewContext: true
            if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                context = __VUE_SSR_CONTEXT__;
            }
            // inject component styles
            if (style) {
                style.call(this, createInjectorSSR(context));
            }
            // register component module identifier for async chunk inference
            if (context && context._registeredComponents) {
                context._registeredComponents.add(moduleIdentifier);
            }
        };
        // used by ssr in case component is cached and beforeCreate
        // never gets called
        options._ssrRegister = hook;
    }
    else if (style) {
        hook = shadowMode
            ? function (context) {
                style.call(this, createInjectorShadow(context, this.$root.$options.shadowRoot));
            }
            : function (context) {
                style.call(this, createInjector(context));
            };
    }
    if (hook) {
        if (options.functional) {
            // register for functional component in vue file
            const originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        }
        else {
            // inject component registration as beforeCreate hook
            const existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}function createInjectorSSR(context) {
    if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
        context = __VUE_SSR_CONTEXT__;
    }
    if (!context)
        return () => { };
    if (!('styles' in context)) {
        context._styles = context._styles || {};
        Object.defineProperty(context, 'styles', {
            enumerable: true,
            get: () => context._renderStyles(context._styles)
        });
        context._renderStyles = context._renderStyles || renderStyles;
    }
    return (id, style) => addStyle(id, style, context);
}
function addStyle(id, css, context) {
    const group =  css.media || 'default' ;
    const style = context._styles[group] || (context._styles[group] = { ids: [], css: '' });
    if (!style.ids.includes(id)) {
        style.media = css.media;
        style.ids.push(id);
        let code = css.source;
        style.css += code + '\n';
    }
}
function renderStyles(styles) {
    let css = '';
    for (const key in styles) {
        const style = styles[key];
        css +=
            '<style data-vue-ssr-id="' +
                Array.from(style.ids).join(' ') +
                '"' +
                (style.media ? ' media="' + style.media + '"' : '') +
                '>' +
                style.css +
                '</style>';
    }
    return css;
}/* script */
var __vue_script__ = script;
/* template */

var __vue_render__ = function __vue_render__() {
  var _vm = this;

  var _h = _vm.$createElement;

  var _c = _vm._self._c || _h;

  return _c('div', {
    staticClass: "table-wrapper"
  }, [_vm._ssrNode("<div class=\"table-actions\">" + (_vm.showActions.includes('create') ? "<div class=\"create table-action\">" + _vm._s(this.generateCreateButton()) + "</div>" : "<!---->") + " " + (_vm.searchableColumns.length ? "<div class=\"search table-action float-right\"><input id=\"search\" type=\"text\" placeholder=\"Search...\"" + _vm._ssrAttr("value", _vm.searchQuery) + " class=\"form-control\"></div>" : "<!---->") + "</div> <div class=\"table-responsive\"><table class=\"table table-bordered\"><thead class=\"font-weight-bold\"><tr>" + _vm._ssrList(_vm.tableHeaders, function (headers) {
    return "<td>" + _vm._ssrList(headers, function (v, k) {
      return "<span>" + (_vm.orderableColumns.includes(k) ? "<a href=\"#\" class=\"orderable\">" + _vm._ssrEscape(_vm._s(v)) + "</a>" : "<span>" + _vm._ssrEscape(_vm._s(v)) + "</span>") + "</span>";
    }) + "</td>";
  }) + "</tr></thead> <tbody>" + (_vm.laravelData.total <= 0 ? "<tr><span class=\"no-results\">No results</span></tr>" : "<!---->") + " " + _vm._ssrList(_vm.laravelData.data, function (r, k) {
    return _vm.laravelData.total > 0 ? "<tr>" + _vm._ssrList(r, function (v, k) {
      return _vm.hideColumns.includes(k) == false ? "<td>" + _vm._ssrEscape(_vm._s(v)) + "</td>" : "<!---->";
    }) + " " + (_vm.showActions.length ? "<td class=\"row-actions\">" + _vm._ssrList(_vm.generateRowActions(r.id), function (v, k) {
      return _vm._ssrList(v, function (v, k) {
        return "<span class=\"action\">" + _vm._s(v) + "</span>";
      });
    }) + "</td>" : "<!---->") + "</tr>" : "<!---->";
  }) + "</tbody></table></div> " + (_vm.laravelData.total > 0 ? "<div id=\"pagination\"><ul class=\"pagination\">" + _vm._ssrList(_vm.laravelData.links, function (link) {
    return "<li" + _vm._ssrClass("page-item", {
      disabled: link.url == null,
      active: link.active
    }) + "><a href=\"#\"" + _vm._ssrAttr("data-href", link.url) + " class=\"page-link\">" + _vm._s(link.label) + "</a></li>";
  }) + "</ul></div>" : "<!---->") + " <div" + _vm._ssrClass("loading-spinner", {
    show: _vm.loading
  }) + "><div class=\"lds-ring\"><div></div> <div></div> <div></div> <div></div></div></div> "), _vm.showPerPage === true ? [_vm._ssrNode("<div class=\"per-page\">", "</div>", [_c('select', {
    directives: [{
      name: "model",
      rawName: "v-model",
      value: _vm.perPage,
      expression: "perPage"
    }],
    staticClass: "custom-select",
    on: {
      "change": function change($event) {
        var $$selectedVal = Array.prototype.filter.call($event.target.options, function (o) {
          return o.selected;
        }).map(function (o) {
          var val = "_value" in o ? o._value : o.value;
          return val;
        });
        _vm.perPage = $event.target.multiple ? $$selectedVal : $$selectedVal[0];
      }
    }
  }, [_c('option', {
    attrs: {
      "value": "5"
    }
  }, [_vm._v("5")]), _vm._v(" "), _c('option', {
    attrs: {
      "value": "25"
    }
  }, [_vm._v("25")]), _vm._v(" "), _c('option', {
    attrs: {
      "value": "50"
    }
  }, [_vm._v("50")]), _vm._v(" "), _c('option', {
    attrs: {
      "value": "100"
    }
  }, [_vm._v("100")]), _vm._v(" "), _c('option', {
    attrs: {
      "value": "250"
    }
  }, [_vm._v("250")]), _vm._v(" "), _c('option', {
    attrs: {
      "value": "500"
    }
  }, [_vm._v("500")]), _vm._v(" "), _c('option', {
    attrs: {
      "value": "1000"
    }
  }, [_vm._v("1000")])])])] : _vm._e()], 2);
};

var __vue_staticRenderFns__ = [];
/* style */

var __vue_inject_styles__ = function __vue_inject_styles__(inject) {
  if (!inject) return;
  inject("data-v-16adfc9e_0", {
    source: "#pagination{display:inline-flex}.per-page{float:right}.table-actions{margin:10px 0}.table-actions .table-action{margin:0 10px;display:inline-block}.table-actions .table-action:first-child{margin-left:0}.table-actions .table-action:last-child{margin-right:0}.table-actions .search{width:200px;display:inline-block;position:relative}.row-actions .action{margin:0 10px}.row-actions .action:first-child{margin-left:0}.row-actions .action:last-child{margin-right:0}.row-actions .action-form{display:inline}.row-actions .action-form button{margin:-1px;padding:0;position:absolute}.loading-spinner{display:inline-flex;opacity:0;transition:opacity .1s cubic-bezier(1,1,0,0);position:absolute;margin:12px}.loading-spinner.show{opacity:1}.loading-spinner.show .lds-ring div{animation:lds-ring 1.2s cubic-bezier(.5,0,.5,1) infinite}.loading-spinner .lds-ring{position:relative}.loading-spinner .lds-ring div{box-sizing:border-box;display:block;position:absolute;border:2px solid #007bff;border-radius:50%;border-color:#007bff transparent transparent transparent;width:16px;height:16px}.loading-spinner .lds-ring div:nth-child(1){animation-delay:-.45s}.loading-spinner .lds-ring div:nth-child(2){animation-delay:-.3s}.loading-spinner .lds-ring div:nth-child(3){animation-delay:-.15s}@keyframes lds-ring{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}",
    map: undefined,
    media: undefined
  });
};
/* scoped */


var __vue_scope_id__ = undefined;
/* module identifier */

var __vue_module_identifier__ = "data-v-16adfc9e";
/* functional template */

var __vue_is_functional_template__ = false;
/* style inject shadow dom */

var __vue_component__ = /*#__PURE__*/normalizeComponent({
  render: __vue_render__,
  staticRenderFns: __vue_staticRenderFns__
}, __vue_inject_styles__, __vue_script__, __vue_scope_id__, __vue_is_functional_template__, __vue_module_identifier__, false, undefined, createInjectorSSR, undefined);// Import vue component

var install = function installVueLaravelTable(Vue) {
  if (install.installed) return;
  install.installed = true;
  Vue.component('VueLaravelTable', __vue_component__);
}; // Create module definition for Vue.use()


var plugin = {
  install: install
}; // To auto-install on non-es builds, when vue is found
// eslint-disable-next-line no-redeclare

/* global window, global */

{
  var GlobalVue = null;

  if (typeof window !== 'undefined') {
    GlobalVue = window.Vue;
  } else if (typeof global !== 'undefined') {
    GlobalVue = global.Vue;
  }

  if (GlobalVue) {
    GlobalVue.use(plugin);
  }
} // Inject install function into component - allows component
// to be registered via Vue.use() as well as Vue.component()


__vue_component__.install = install; // Export component by default
// also be used as directives, etc. - eg. import { RollupDemoDirective } from 'rollup-demo';
// export const RollupDemoDirective = component;
exports.default=__vue_component__;