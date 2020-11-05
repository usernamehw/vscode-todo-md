import Vue from 'vue';
import App from './app/App.vue';
import { store } from './app/store';

new Vue({
	store,
	render: h => h(App),
}).$mount('#app');
