<template>

  <div class="table-wrapper">

    <div class="table-actions">
      <template v-if="showActions.includes('create')">
        <span v-html="this.generateCreateButton()"></span>
      </template>
    </div>
      
    <table class="table table-bordered">

      <thead class="font-weight-bold">
        <tr>
          <td v-for="header in tableHeaders">{{ header }}</td>
          <td v-if="showActions.length">Actions</td>
        </tr>
      </thead>

      <tbody>
        <tr v-for="(r, k) in laravelData.data">
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

    <Pagination :show-disabled="true" :data="laravelData" @pagination-change-page="getResults"></Pagination>

    <div :class="{ show: loading }" class="loading-spinner">
      <div class="lds-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
      </div>
    </div>

  </div>

</template>



<script>
import Pagination from 'laravel-vue-pagination';
export default {

  name: 'vue-laravel-table',
  components: { Pagination },
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
      type: Boolean
    },
    csrfToken: {
      type: String,
      required: false
    }
  },

  data: function() {
    return {
      laravelData: {},
      tableHeaders: [],
      loading: false,
      acceptedActions: ['create', 'edit', 'show', 'delete']
    }
  },

  mounted() {
    this.getResults();
  },

  computed: {
    generateTableHeaders: function() {
      var headers = [];
      for(const [k, v] of Object.entries(this.laravelData.data[0])) {
        this.hideColumns.includes(k) && headers.push(this.formatHeader(k));
      }
      return headers;
    }
  },

  methods: {

    getResults(page = 1) {
      this.loading = true;
      axios.get(this.laravelDataUrl + '?page=' + page)
      .then(response => {
        this.laravelData = response.data;
        this.tableHeaders = this.generateTableHeaders;
        this.loading = false;
      })
      .catch((error) => {
        throw new Error(error);
      });
    },

    formatHeader(str) {
      return (str[0].toUpperCase() + str.slice(1)).replace(/_/g, ' ');
    },

    generateRowActions(id) {
      var generatedActions = [];

      for(const [k, v] of Object.entries(this.showActions)) {
        (this.acceptedActions.includes(v) && v != 'create') && generatedActions.push({
          [v]: this.generateActionHtml(v, this.csrfToken, id)
        });
      }

      return generatedActions;
    },

    generateCreateButton() {
      return this.generateActionHtml('create');
    },

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
          var iconOrText = (this.showActionIcons) ? '<i class="fas fa-fw fa-times"></i>' : 'Delete';
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

    .pagination {
        display:inline-flex!important;
    }

    .table-actions {
      margin:10px 0;

      span {
        margin:0 10px;

        &:first-child {
          margin-left:0;
        }

        &:last-child {
          margim-right:0;
        }
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
        display:inline-flex;

        button {
          padding:0;
          margin:0;
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