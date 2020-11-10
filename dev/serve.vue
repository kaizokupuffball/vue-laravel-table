<script>
import Vue from 'vue';
import VueLaravelTable from '@/vue-laravel-table.vue';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';
import '../node_modules/@fortawesome/fontawesome-free/css/fontawesome.min.css';
import '../node_modules/@fortawesome/fontawesome-free/css/all.min.css';


export default Vue.extend({
  name: 'ServeDev',
  components: {
    VueLaravelTable
  }
});
</script>

<template>
  <div id="app">
    <div class="container">
      <div class="row">
        <div class="col">
          <vue-laravel-table
            laravel-data-url="http://table-test.test/datatable/users"
            :laravel-data-resource="{ name: 'users', prefix: 'dashboard' }"
            :show-actions="['create', 'show', 'edit', 'delete']"
            :show-action-icons="true"
            :show-per-page="true"
            :hide-columns="['created_at', 'id']"
            :searchable-columns="['name']"
            :orderable-columns="['name', 'email']"
            csrf-token="test"
          />
        </div>
      </div>
    </div>
  </div>
</template>