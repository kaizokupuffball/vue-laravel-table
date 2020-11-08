import Vue from 'vue';
import Dev from './serve.vue';
window.axios = require('axios');
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window._ = require('lodash');

Vue.config.productionTip = false;
Vue.prototype.$http = axios

new Vue({
  render: (h) => h(Dev),
}).$mount('#app');
