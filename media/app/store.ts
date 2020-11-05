import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { filterItems } from '../../src/filter';
import { defaultSortTasks } from '../../src/sort';
import { TheTask } from '../../src/TheTask';
import { DueState, WebviewMessage } from '../../src/types';

Vue.use(Vuex);

const enum Mutation {
	UPDATE_FILTER_VALUE = 'UPDATE_FILTER_VALUE',
	TOGGLE_DONE = 'TOGGLE_DONE',
}

export const store = new Store({
	// strict: isDev,
	state: {
		tasks: [],
		tags: [],
		projects: [],
		contexts: [],
		defaultFileSpecified: false,
		activeDocumentOpened: false,
		filterInputValue: '',
		config: {
			autoShowSuggest: true,
			showCompleted: true,
			showRecurringCompleted: true,
			showRecurringNotDue: true,
			completedStrikeThrough: false,
			showPriority: true,
			fontSize: '13px',
			padding: '0px',
			customCheckboxEnabled: false,
			markdownEnabled: false,
			checkboxStyle: 'rounded-square',
			fontFamily: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'Segoe UI Emoji'`,
		},
	},
	getters: {
		filteredSortedTasks: state => {
			let filteredTasks = state.tasks;
			if (state.filterInputValue !== '') {
				filteredTasks = filterItems(filteredTasks, state.filterInputValue);
			}
			if (!state.config.showRecurringCompleted) {
				filteredTasks = filteredTasks.filter(task => {
					if (task.due?.isRecurring && task.done) {
						return false;
					} else {
						return true;
					}
				});
			}
			if (!state.config.showRecurringNotDue) {
				filteredTasks = filteredTasks.filter(task => {
					if (task.due?.isRecurring && task.due.isDue === DueState.notDue) {
						return false;
					} else {
						return true;
					}
				});
			}
			if (!state.config.showCompleted) {
				filteredTasks = filteredTasks.filter(task => !task.done);
			}
			return defaultSortTasks(filteredTasks);
		},
		autocompleteItems: state => {
			const filterConstants = [
				'$due',
				'$done',
				'$overdue',
				'$recurring',
				'$noTag',
				'$noProject',
				'$noContext',
			];
			const autocompleteTags = state.tags.map(tag => `#${tag}`);
			const autocompleteProjects = state.projects.map(project => `+${project}`);
			const autocompleteContexts = state.contexts.map(context => `@${context}`);
			return [{
				data: filterConstants.concat(autocompleteTags, autocompleteProjects, autocompleteContexts),
			}];
		},
	},
	mutations: {
		[Mutation.UPDATE_FILTER_VALUE]: (state, newValue: string) => {
			state.filterInputValue = newValue;
		},
		[Mutation.TOGGLE_DONE]: (state, task: TheTask) => {
			task.done = !task.done;
		},
	},
	actions: {},
});

interface SavedState {
	filterInputValue: string;
}
interface VscodeWebviewApi {
	getState(): SavedState;
	setState(state: SavedState): void;
	postMessage(message: WebviewMessage): void;
}
/** @ts-ignore */
export const vscodeApi: VscodeWebviewApi = acquireVsCodeApi();
window.onerror = function(message, source, lineno, colno, error) {
	vscodeApi.postMessage({
		type: 'showNotification',
		value: `[WEBVIEW] ${message}`,
	});
};
const savedState = getState();
updateFilterValueMutation(savedState.filterInputValue);
// store.state.filterInputValue = savedState.filterInputValue;

function getState(): SavedState {
	const savedStateDefaults: SavedState = {
		filterInputValue: '',
	};
	return vscodeApi.getState() ?? savedStateDefaults;
}

window.addEventListener('message', event => {
	const message: WebviewMessage = event.data; // The json data that the extension sent
	switch (message.type) {
		case 'updateEverything': {
			store.state.tasks = message.value.tasks;
			store.state.tags = message.value.tags;
			store.state.projects = message.value.projects;
			store.state.contexts = message.value.contexts;
			store.state.defaultFileSpecified = message.value.defaultFileSpecified;
			store.state.activeDocumentOpened = message.value.activeDocumentOpened;
			store.state.config = message.value.config;
			document.body.style.setProperty('--font-size', message.value.config.fontSize);
			document.body.style.setProperty('--font-family', message.value.config.fontFamily);
			document.body.style.setProperty('--padding', message.value.config.padding);
			// if (this.config.completedStrikeThrough) {
			// 	$listEl.classList.add('completed-strike-through');
			// } else {
			// 	$listEl.classList.remove('completed-strike-through');
			// }
			break;
		}
	}
});

export function updateFilterValueMutation(newValue: string) {
	store.commit(Mutation.UPDATE_FILTER_VALUE, newValue);
	vscodeApi.setState({
		filterInputValue: newValue,
	});
}
export function toggleDoneMutation(task: TheTask) {
	store.commit(Mutation.TOGGLE_DONE, task);
	vscodeApi.postMessage({
		type: 'toggleDone',
		value: task.lineNumber,
	});
}
