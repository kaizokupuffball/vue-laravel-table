import _ from 'lodash';

//
var script = {
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
  data: function () {
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

  mounted() {
    this.getResults();
  },

  computed: {
    /**
     * Table headers are computed, since they will not likey change
     * ever because they are the keys of the database table that we
     * get the data from
     */
    generateTableHeaders: function () {
      var headers = [];

      if (this.laravelData.total > 0) {
        for (const [k, v] of Object.entries(this.laravelData.data[0])) {
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
    searchQuery: _.debounce(function (v) {
      this.search(v);
    }, 300),

    /**
     * Just update the perPage number
     * when the user selected another than the default
     */
    perPage: function (v) {
      this.changePerPage(v);
    }
  },
  methods: {
    /**
     * Order toggling based on column key and 
     * order direction (asc, desc)
     */
    toggleOrder(event, key) {
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
    search(q) {
      this.currentPage = 1;
      this.getResults(q);
    },

    /**
     * Simple pagination based on what link got clicked in the pagination
     * elements.. Search query are also beeing added to the URL if there
     * has been a search
     */
    paginate(event) {
      event.preventDefault();
      var url = new URL(event.target.getAttribute('data-href'));
      this.currentPage = url.searchParams.get('page');
      this.getResults(this.searchQuery);
    },

    /**
     * When the user changes the items per page, the table refreshes
     */
    changePerPage(itemsPerPage) {
      this.currentPage = 1;
      this.getResults(this.searchQuery);
    },

    getResults(searchQuery = false) {
      // Start loading spinner
      this.loading = true; // Prepare the URL

      let url = new URL(this.laravelDataUrl);
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
      axios.get(url).then(response => {
        this.laravelData = response.data;
        this.tableHeaders = this.generateTableHeaders;
        this.loading = false;
      }).catch(error => {
        throw new Error(error);
      });
    },

    /**
     * Simple header formating
     * Capitalizing and removing underscores that may
     * come from the laravel data object (database column names)
     */
    formatHeader(str) {
      return (str[0].toUpperCase() + str.slice(1)).replace(/_/g, ' ');
    },

    /**
     * This generates the row actions, 
     * only show, edit and delete actions
     * and not the create action because that is not
     * placed in a table row, rather at the top of the table
     */
    generateRowActions(id) {
      var generatedActions = [];

      for (const [k, v] of Object.entries(this.showActions)) {
        this.acceptedActions.includes(v) && v != 'create' && generatedActions.push({
          [v]: this.generateActionHtml(v, this.csrfToken, id)
        });
      }

      return generatedActions;
    },

    /**
     * Simply generates a create button based on
     * the data resource passed with props
     */
    generateCreateButton() {
      return this.generateActionHtml('create');
    },

    /**
     * Generates actions based on what kind of type it is
     * For now, one can generate links for create, edit, and show model
     * and generate a create model button/link
     */
    generateActionHtml(type, csrf, id = false) {
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
};

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
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
}

const isOldIE = typeof navigator !== 'undefined' &&
    /msie [6-9]\\b/.test(navigator.userAgent.toLowerCase());
function createInjector(context) {
    return (id, style) => addStyle(id, style);
}
let HEAD;
const styles = {};
function addStyle(id, css) {
    const group = isOldIE ? css.media || 'default' : id;
    const style = styles[group] || (styles[group] = { ids: new Set(), styles: [] });
    if (!style.ids.has(id)) {
        style.ids.add(id);
        let code = css.source;
        if (css.map) {
            // https://developer.chrome.com/devtools/docs/javascript-debugging
            // this makes source maps inside style tags work properly in Chrome
            code += '\n/*# sourceURL=' + css.map.sources[0] + ' */';
            // http://stackoverflow.com/a/26603875
            code +=
                '\n/*# sourceMappingURL=data:application/json;base64,' +
                    btoa(unescape(encodeURIComponent(JSON.stringify(css.map)))) +
                    ' */';
        }
        if (!style.element) {
            style.element = document.createElement('style');
            style.element.type = 'text/css';
            if (css.media)
                style.element.setAttribute('media', css.media);
            if (HEAD === undefined) {
                HEAD = document.head || document.getElementsByTagName('head')[0];
            }
            HEAD.appendChild(style.element);
        }
        if ('styleSheet' in style.element) {
            style.styles.push(code);
            style.element.styleSheet.cssText = style.styles
                .filter(Boolean)
                .join('\n');
        }
        else {
            const index = style.ids.size - 1;
            const textNode = document.createTextNode(code);
            const nodes = style.element.childNodes;
            if (nodes[index])
                style.element.removeChild(nodes[index]);
            if (nodes.length)
                style.element.insertBefore(textNode, nodes[index]);
            else
                style.element.appendChild(textNode);
        }
    }
}

/* script */
const __vue_script__ = script;
/* template */

var __vue_render__ = function () {
  var _vm = this;

  var _h = _vm.$createElement;

  var _c = _vm._self._c || _h;

  return _c('div', {
    staticClass: "table-wrapper"
  }, [_c('div', {
    staticClass: "table-actions"
  }, [_vm.showActions.includes('create') ? [_c('div', {
    staticClass: "create table-action",
    domProps: {
      "innerHTML": _vm._s(this.generateCreateButton())
    }
  })] : _vm._e(), _vm._v(" "), _vm.searchableColumns.length ? [_c('div', {
    staticClass: "search table-action float-right"
  }, [_c('input', {
    directives: [{
      name: "model",
      rawName: "v-model",
      value: _vm.searchQuery,
      expression: "searchQuery"
    }],
    staticClass: "form-control",
    attrs: {
      "id": "search",
      "type": "text",
      "placeholder": "Search..."
    },
    domProps: {
      "value": _vm.searchQuery
    },
    on: {
      "input": function ($event) {
        if ($event.target.composing) {
          return;
        }

        _vm.searchQuery = $event.target.value;
      }
    }
  })])] : _vm._e()], 2), _vm._v(" "), _c('div', {
    staticClass: "table-responsive"
  }, [_c('table', {
    staticClass: "table table-bordered"
  }, [_c('thead', {
    staticClass: "font-weight-bold"
  }, [_c('tr', _vm._l(_vm.tableHeaders, function (headers) {
    return _c('td', _vm._l(headers, function (v, k) {
      return _c('span', [_vm.orderableColumns.includes(k) ? _c('a', {
        staticClass: "orderable",
        attrs: {
          "href": "#"
        },
        on: {
          "click": function ($event) {
            return _vm.toggleOrder($event, k);
          }
        }
      }, [_vm._v(_vm._s(v))]) : _c('span', [_vm._v(_vm._s(v))])]);
    }), 0);
  }), 0)]), _vm._v(" "), _c('tbody', [_vm.laravelData.total <= 0 ? _c('tr', [_c('span', {
    staticClass: "no-results"
  }, [_vm._v("No results")])]) : _vm._e(), _vm._v(" "), _vm._l(_vm.laravelData.data, function (r, k) {
    return _vm.laravelData.total > 0 ? _c('tr', [_vm._l(r, function (v, k) {
      return _vm.hideColumns.includes(k) == false ? _c('td', [[_vm._v(_vm._s(v))]], 2) : _vm._e();
    }), _vm._v(" "), _vm.showActions.length ? _c('td', {
      staticClass: "row-actions"
    }, [_vm._l(_vm.generateRowActions(r.id), function (v, k) {
      return _vm._l(v, function (v, k) {
        return _c('span', {
          staticClass: "action",
          domProps: {
            "innerHTML": _vm._s(v)
          }
        });
      });
    })], 2) : _vm._e()], 2) : _vm._e();
  })], 2)])]), _vm._v(" "), _vm.laravelData.total > 0 ? _c('div', {
    attrs: {
      "id": "pagination"
    }
  }, [_c('ul', {
    staticClass: "pagination"
  }, [_vm._l(_vm.laravelData.links, function (link) {
    return [_c('li', {
      staticClass: "page-item",
      class: {
        disabled: link.url == null,
        active: link.active
      }
    }, [_c('a', {
      staticClass: "page-link",
      attrs: {
        "href": "#",
        "data-href": link.url
      },
      domProps: {
        "innerHTML": _vm._s(link.label)
      },
      on: {
        "click": function ($event) {
          return _vm.paginate($event);
        }
      }
    })])];
  })], 2)]) : _vm._e(), _vm._v(" "), _c('div', {
    staticClass: "loading-spinner",
    class: {
      show: _vm.loading
    }
  }, [_vm._m(0)]), _vm._v(" "), _vm.showPerPage === true ? [_c('div', {
    staticClass: "per-page"
  }, [_c('select', {
    directives: [{
      name: "model",
      rawName: "v-model",
      value: _vm.perPage,
      expression: "perPage"
    }],
    staticClass: "custom-select",
    on: {
      "change": function ($event) {
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

var __vue_staticRenderFns__ = [function () {
  var _vm = this;

  var _h = _vm.$createElement;

  var _c = _vm._self._c || _h;

  return _c('div', {
    staticClass: "lds-ring"
  }, [_c('div'), _vm._v(" "), _c('div'), _vm._v(" "), _c('div'), _vm._v(" "), _c('div')]);
}];
/* style */

const __vue_inject_styles__ = function (inject) {
  if (!inject) return;
  inject("data-v-16adfc9e_0", {
    source: "#pagination{display:inline-flex}.per-page{float:right}.table-actions{margin:10px 0}.table-actions .table-action{margin:0 10px;display:inline-block}.table-actions .table-action:first-child{margin-left:0}.table-actions .table-action:last-child{margin-right:0}.table-actions .search{width:200px;display:inline-block;position:relative}.row-actions .action{margin:0 10px}.row-actions .action:first-child{margin-left:0}.row-actions .action:last-child{margin-right:0}.row-actions .action-form{display:inline}.row-actions .action-form button{margin:-1px;padding:0;position:absolute}.loading-spinner{display:inline-flex;opacity:0;transition:opacity .1s cubic-bezier(1,1,0,0);position:absolute;margin:12px}.loading-spinner.show{opacity:1}.loading-spinner.show .lds-ring div{animation:lds-ring 1.2s cubic-bezier(.5,0,.5,1) infinite}.loading-spinner .lds-ring{position:relative}.loading-spinner .lds-ring div{box-sizing:border-box;display:block;position:absolute;border:2px solid #007bff;border-radius:50%;border-color:#007bff transparent transparent transparent;width:16px;height:16px}.loading-spinner .lds-ring div:nth-child(1){animation-delay:-.45s}.loading-spinner .lds-ring div:nth-child(2){animation-delay:-.3s}.loading-spinner .lds-ring div:nth-child(3){animation-delay:-.15s}@keyframes lds-ring{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}",
    map: undefined,
    media: undefined
  });
};
/* scoped */


const __vue_scope_id__ = undefined;
/* module identifier */

const __vue_module_identifier__ = undefined;
/* functional template */

const __vue_is_functional_template__ = false;
/* style inject SSR */

/* style inject shadow dom */

const __vue_component__ = /*#__PURE__*/normalizeComponent({
  render: __vue_render__,
  staticRenderFns: __vue_staticRenderFns__
}, __vue_inject_styles__, __vue_script__, __vue_scope_id__, __vue_is_functional_template__, __vue_module_identifier__, false, createInjector, undefined, undefined);

// Import vue component

const install = function installVueLaravelTable(Vue) {
  if (install.installed) return;
  install.installed = true;
  Vue.component('VueLaravelTable', __vue_component__);
}; // Create module definition for Vue.use()
// to be registered via Vue.use() as well as Vue.component()


__vue_component__.install = install; // Export component by default
// also be used as directives, etc. - eg. import { RollupDemoDirective } from 'rollup-demo';
// export const RollupDemoDirective = component;

export default __vue_component__;
