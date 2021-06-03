import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import { showToastNotification } from '..';
import { filterItems } from '../../src/filter';
import { defaultSortTasks } from '../../src/sort';
import { TheTask } from '../../src/TheTask';
import { DueState, ExtensionConfig, MessageFromWebview, MessageToWebview } from '../../src/types';
import App from './App';
import { SendMessage } from './SendMessage';
import { flattenDeep, getTaskAtLineWebview, isTaskVisible } from './storeUtils';

Vue.use(Vuex);

const enum Mutation {
	UPDATE_FILTER_VALUE = 'UPDATE_FILTER_VALUE',
	TOGGLE_DONE = 'TOGGLE_DONE',
	SELECT_TASK = 'SELECT_TASK',
}
const enum Action {
	SELECT_NEXT_TASK = 'SELECT_NEXT_TASK',
	SELECT_PREV_TASK = 'SELECT_PREV_TASK',
}
// TODO: maybe use dynamic type with keyof and ReturnType<>?
export interface Getters {
	filteredSortedTasks: TheTask[];
	flattenedFilteredSortedTasks: TheTask[];
	autocompleteItems: [{
		data: string[];
	}];
}

export const store = new Store({
	// strict: isDev,
	state: {
		tasksAsTree: [] as TheTask[],
		tags: [] as string[],
		projects: [] as string[],
		contexts: [] as string[],
		defaultFileSpecified: true,
		activeDocumentOpened: false,
		filterInputValue: '',
		config: {
			autoShowSuggest: true,
			showCompleted: true,
			showRecurringCompleted: true,
			showRecurringUpcoming: true,
			completedStrikeThrough: false,
			showPriority: true,
			showCheckbox: true,
			fontSize: '13px',
			padding: '0px',
			customCheckboxEnabled: false,
			notificationsEnabled: false,
			showTaskDetails: false,
			fontFamily: `'Segoe UI', Tahoma, Geneva, Verdana, sans-serif, 'Segoe UI Emoji'`,
			indentSize: '1.8em',
			tagStyles: {},
			lineHeight: 1.4,
		} as ExtensionConfig['webview'],
		selectedTaskLineNumber: -1,
	},
	getters: {
		filteredSortedTasks: state => {
			let filteredTasks = state.tasksAsTree;
			if (state.filterInputValue !== '') {
				filteredTasks = filterItems(filteredTasks, state.filterInputValue || '');
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
			if (!state.config.showRecurringUpcoming) {
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
		flattenedFilteredSortedTasks: (state, getters) => flattenDeep(getters.filteredSortedTasks),
		autocompleteItems: state => {
			const filterConstants = [// TODO: constants should be in const enum
				'$due',
				'$started',
				'$hasDue',
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
		[Mutation.SELECT_TASK]: (state, lineNumber: number) => {
			state.selectedTaskLineNumber = lineNumber;
		},
		[Mutation.UPDATE_FILTER_VALUE]: (state, newValue: string) => {
			state.filterInputValue = newValue;
		},
		[Mutation.TOGGLE_DONE]: (state, task: TheTask) => {
			task.done = !task.done;
		},
	},
	actions: {
		[Action.SELECT_NEXT_TASK]({ commit, state, getters: gt }) {
			const getters = gt as Getters;
			if (!getters.filteredSortedTasks.length) {
				return undefined;
			}
			let targetTask: TheTask;
			if (state.selectedTaskLineNumber === -1) {
				// None selected. Select the first visible task
				targetTask = getters.filteredSortedTasks[0];
			} else {
				// Selected task exists
				const selectedTask = getTaskAtLineWebview(state.selectedTaskLineNumber);

				const tasks = getters.flattenedFilteredSortedTasks.filter(task => isTaskVisible(task));
				if (tasks.length < 2) {
					return undefined;
				}

				const currentIndex = tasks.findIndex(task => selectedTask.lineNumber === task.lineNumber);
				targetTask = currentIndex === tasks.length - 1 ? tasks[0] : tasks[currentIndex + 1];
			}
			selectTaskMutation(targetTask.lineNumber);
			return targetTask.lineNumber;
		},
		[Action.SELECT_PREV_TASK]({ commit, state, getters: gt }) {
			const getters = gt as Getters;
			if (!getters.filteredSortedTasks.length) {
				return undefined;
			}
			let targetTask: TheTask;
			if (state.selectedTaskLineNumber === -1) {
				// None selected. Select the first visible task
				targetTask = getters.flattenedFilteredSortedTasks[getters.flattenedFilteredSortedTasks.length - 1];
			} else {
				const selectedTask = getTaskAtLineWebview(state.selectedTaskLineNumber);
				if (!selectedTask) {
					return undefined;
				}

				const tasks = getters.flattenedFilteredSortedTasks.filter(task => isTaskVisible(task));

				if (tasks.length < 2) {
					return undefined;
				}

				const currentIndex = tasks.findIndex(task => selectedTask.lineNumber === task.lineNumber);
				if (currentIndex === 0) {
					targetTask = tasks[tasks.length - 1];
				} else {
					targetTask = tasks[currentIndex - 1];
				}
			}
			selectTaskMutation(targetTask.lineNumber);
			return targetTask.lineNumber;
		},
	},
});

interface SavedState {
	filterInputValue: string;
}
interface VscodeWebviewApi {
	getState(): SavedState;
	setState(state: SavedState): void;
	postMessage(message: MessageFromWebview): void;
}
/** @ts-ignore */
// eslint-disable-next-line no-undef
export const vscodeApi: VscodeWebviewApi = acquireVsCodeApi();
window.onerror = function(message, source, lineno, colno, error) {
	SendMessage.showNotification(`[WEBVIEW] ${message}`);
};
const savedState = getState();
updateFilterValueMutation(savedState.filterInputValue);

function getState(): SavedState {
	const savedStateDefaults: SavedState = {
		filterInputValue: '',
	};
	return vscodeApi.getState() ?? savedStateDefaults;
}

window.addEventListener('message', event => {
	const message: MessageToWebview = event.data; // The json data that the extension sent
	switch (message.type) {
		case 'updateEverything': {
			store.state.config = message.value.config;
			store.state.defaultFileSpecified = message.value.defaultFileSpecified;
			store.state.activeDocumentOpened = message.value.activeDocumentOpened;
			store.state.tasksAsTree = message.value.tasksAsTree;
			store.state.tags = message.value.tags;
			store.state.projects = message.value.projects;
			store.state.contexts = message.value.contexts;
			const bodyStyle = document.body.style;
			bodyStyle.setProperty('--font-size', message.value.config.fontSize);
			bodyStyle.setProperty('--font-family', message.value.config.fontFamily);
			bodyStyle.setProperty('--line-height', String(message.value.config.lineHeight));
			bodyStyle.setProperty('--padding', message.value.config.padding);
			bodyStyle.setProperty('--priority-left-padding', message.value.config.showPriority ? '3px' : '1px');
			bodyStyle.setProperty('--indent-size', message.value.config.indentSize);
			bodyStyle.setProperty('--list-scrollbar-value', message.value.config.scrollbarOverflow ? 'overlay' : 'auto');
			break;
		}
		case 'focusFilterInput': {
			App.focusFilterInput();
			break;
		}
	}
});

// mutations
export function updateFilterValueMutation(newValue: string) {
	store.commit(Mutation.UPDATE_FILTER_VALUE, newValue);
	vscodeApi.setState({
		filterInputValue: newValue,
	});
}
export function toggleDoneMutation(task: TheTask) {
	store.commit(Mutation.TOGGLE_DONE, task);
	if (task.done && store.state.config.notificationsEnabled) {
		showToastNotification(`${task.title}`, {
			type: 'success',
		});
	}
	SendMessage.toggleDone(task.lineNumber);
}
export function selectTaskMutation(lineNumber: number) {
	store.commit(Mutation.SELECT_TASK, lineNumber);
}

// actions
export async function selectNextTaskAction() {
	return store.dispatch(Action.SELECT_NEXT_TASK);
}
export async function selectPrevTaskAction() {
	return store.dispatch(Action.SELECT_PREV_TASK);
}
