<template>

  <div class="table-wrapper">

    <div class="table-actions">

      <template v-if="showActions.includes('create')">
        <div class="create table-action" v-html="this.generateCreateButton()">
        </div>
      </template>

      <template v-if="searchableColumns.length">
        <div class="search table-action float-right">
          <input v-model="searchQuery" id="search" class="form-control" type="text" placeholder="Search..." />
        </div> 
      </template>

    </div>
      
    <div class="table-responsive">
      <table class="table table-bordered">

        <thead class="font-weight-bold">
          <tr>
            <td v-for="headers in tableHeaders">
              <span v-for="(v, k) in headers">
                <a v-if="orderableColumns.includes(k)" class="orderable" href="#" v-on:click="toggleOrder($event, k)">{{ v }}</a>
                <span v-else>{{ v }}</span>
              </span>
            </td>
          </tr>
        </thead>

        <tbody>

          <tr v-if="laravelData.total <= 0">
            <span class="no-results">No results</span>
          </tr>

          <tr v-if="laravelData.total > 0" v-for="(r, k) in laravelData.data">

            <td v-for="(v, k) in r" v-if="hideColumns.includes(k) == false">
              <template>{{ v }}</template>
            </td>

            <td v-if="showActions.length" class="row-actions">
              <template v-for="(v, k) in generateRowActions(r.id)">
                <span class="action" v-for="(v, k) in v" v-html="v"></span>
              </template>
            </td>

          </tr>

        </tbody>

      </table>
    </div>

    <div v-if="laravelData.total > 0" id="pagination">
      <ul class="pagination">
        <template v-for="link in laravelData.links">
          <li class="page-item" :class="{ disabled: link.url == null, active: link.active }">
            <a class="page-link" href="#" :data-href="link.url" v-html="link.label" v-on:click="paginate($event)"></a>
          </li>
        </template>
      </ul>
    </div>

    <div :class="{ show: loading }" class="loading-spinner">
      <div class="lds-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
      </div>
    </div>
        
    <template v-if="showPerPage === true">
      <div class="per-page">
        <select v-model="perPage" class="custom-select">
            <option value="5">5</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="250">250</option>
            <option value="500">500</option>
            <option value="1000">1000</option>
        </select>
      </div>
    </template>

  </div>

</template>



<script>
import _ from 'lodash';
export default {
  
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

  data: function() {
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
    }
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
    generateTableHeaders: function() {
      var headers = [];
      if (this.laravelData.total > 0) {
        for(const [k, v] of Object.entries(this.laravelData.data[0])) {
          if(!this.hideColumns.includes(k)) {
            var obj = {};
            obj[k] = this.formatHeader(k);
            headers.push(obj);
          }
        }
        if (this.showActions.length) {
          var obj = {};
          obj['actions'] = this.formatHeader('actions');
        } headers.push(obj);
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
    searchQuery: _.debounce(function(v) {
      this.search(v);
    }, 300),

    /**
     * Just update the perPage number
     * when the user selected another than the default
     */
    perPage: function(v) {
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
      }

      else if (this.orderBy.direction == 'asc') {
        this.orderBy.direction = 'desc';
        this.orderBy.column = key;
      }

      else if (this.orderBy.direction == 'desc') {
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
      this.loading = true;

      // Prepare the URL
      let url = new URL(this.laravelDataUrl);
      url.searchParams.set('page', this.currentPage);

      // Add search parameters if there exists a search
      if (searchQuery !== false && searchQuery.length) {
        url.searchParams.set('q', searchQuery);
        url.searchParams.set('qC', this.searchableColumns);
      }

      // Add order parameters if they exist
      if (this.orderBy.column != false || this.orderBy.direction != false) {
        url.searchParams.set('orderBy', this.orderBy.column);
        url.searchParams.set('orderDirection', this.orderBy.direction);
      }

      // Add perPage parameters
      url.searchParams.set('perPage', this.perPage);

      axios.get(url)
      .then(response => {
        this.laravelData = response.data;
        this.tableHeaders = this.generateTableHeaders;
        this.loading = false;
      })
      .catch((error) => {
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

      for(const [k, v] of Object.entries(this.showActions)) {
        (this.acceptedActions.includes(v) && v != 'create') && generatedActions.push({
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
      var url = (this.laravelDataResource.prefix)
      ? ('/' + this.laravelDataResource.prefix + '/' + this.laravelDataResource.name + '/')
      :('/' + this.laravelDataResource.name + '/');

      switch(type) {

        case 'create':
          var iconOrText = (this.showActionIcons) ? '<i class="fas fa-fw fa-plus"></i>' : 'Create';
          html = '<a class="action-link btn btn-primary" href="'+ url + 'create">'+ iconOrText +'</a>';
          break;

        case 'edit':
          var iconOrText = (this.showActionIcons) ? '<i class="fas fa-fw fa-edit"></i>' : 'Edit';
          html = '<a class="action-link" href="'+ url + id + '/edit">'+ iconOrText +'</a>';
          break;

        case 'show':
          var iconOrText = (this.showActionIcons) ? '<i class="fas fa-fw fa-eye"></i>' : 'Show';
          html = '<a class="action-link" href="'+ url + id +'">'+ iconOrText +'</a>';
          break;

        case 'delete':
          var iconOrText = (this.showActionIcons) ? '<i class="fas fa-fw fa-trash"></i>' : 'Delete';
          html = '<form class="action-form" method="post" action="'+ url + id +'">'+
                  '<input type="hidden" name="_token" value="'+ csrf +'">'+
                  '<input type="hidden" name="_method" value="DELETE">'+
                  '<button class="btn btn-link text-danger" type="submit">'+ iconOrText +'</button>'+
                 '</form>';
          break;
      }

      return html;
    }

  }

}
</script>

<style lang="scss">

    $spinnerColor:#007bff;

    #pagination {
      display:inline-flex;
    }

    .per-page {
      float:right;
    }

    .table-actions {
      margin:10px 0;

      .table-action {
        margin:0 10px;
        display:inline-block;

        &:first-child {
          margin-left:0;
        }

        &:last-child {
          margin-right:0;
        }
      }

      .search {
        width:200px;
        display:inline-block;
        position:relative;
      }
    }

    .row-actions {
      .action {
        margin:0 10px;

        &:first-child {
          margin-left:0;
        }

        &:last-child {
          margin-right:0;
        }
      }

      .action-form {
        display:inline;

        button {
          margin:-1px;
          padding:0;
          position:absolute;

        }
      }
    }

    .loading-spinner {
        display:inline-flex;
        opacity:0;
        transition:opacity .1s cubic-bezier(1, 1, 0, 0);
        position:absolute;
        margin:12px;

        &.show {
            opacity:1;

            .lds-ring {
                div {
                    animation:lds-ring 1.2s cubic-bezier(.5, 0, .5, 1) infinite;
                }
            }
        }

        .lds-ring {
            position:relative;

            div {
                box-sizing:border-box;
                display:block;
                position:absolute;
                border:2px solid $spinnerColor;
                border-radius:50%;
                border-color:$spinnerColor transparent transparent transparent;
                width:16px;
                height:16px;

                &:nth-child(1) {
                    animation-delay:-.45s;
                }

                &:nth-child(2) {
                    animation-delay:-.3s;
                }

                &:nth-child(3) {
                    animation-delay:-.15s;
                }
            }
        }
    }

    @keyframes lds-ring {
        0% {
            transform:rotate(0deg);
        }
        100% {
            transform:rotate(360deg);
        }
    }

</style>