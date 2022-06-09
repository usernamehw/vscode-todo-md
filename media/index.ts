import Notifications, { notify } from '@kyvg/vue3-notification';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import relativeTime from 'dayjs/plugin/relativeTime';
import mitt from 'mitt';
import { createApp } from 'vue';
import App from './app/App.vue';
import { pinia } from './app/store';
import TaskComponent from './app/components/Task/Task.vue';

dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(isoWeek);
dayjs.extend(duration);
dayjs.Ls.en.weekStart = 1;

// Vue.config.productionTip = false;
// Vue.config.devtools = false;

const emitter = mitt();

const app = createApp(App);
app.config.globalProperties.emitter = emitter;
app.use(pinia);
app.use(Notifications);
app.component('task', TaskComponent);
app.mount('#app');

type NotificationType = 'error' | 'info' | 'success' | 'warn';

/**
 * Show toast notification
 * @see https://github.com/kyvg/vue3-notification
 */
export function showToastNotification(text: string, {
	type = 'info',
}: {
	type?: NotificationType;
} = {}) {
	notify({
		text,
		group: 'group1',
		type,
	});
}
