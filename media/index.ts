import Vue from 'vue';
import App from './app/App.vue';
import { store } from './app/store';

const app = new Vue({
	store,
	render: h => h(App),
}).$mount('#app');

/**
 * Show toast notification
 */
export function showNotification(text: string) {
	app.$notify({
		text,
	});
}
