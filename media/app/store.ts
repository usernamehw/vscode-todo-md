import difference from 'lodash/difference';
import { createPinia, defineStore } from 'pinia';
import { showToastNotification } from '..';
import { filterConstants, filterTasks, FilterTasksResult } from '../../src/filter';
import { defaultSortTasks } from '../../src/sort';
import type { TheTask } from '../../src/TheTask';
import { ExtensionConfig, IsDue, MessageFromWebview, MessageToWebview } from '../../src/types';
import { SendMessage } from './SendMessage';

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

export const pinia = createPinia();
// Without prefix TypeScript autocomplete breaks :(
// setMapStoreSuffix('');
// declare module 'pinia' {
// 	export interface MapStoresCustomization {
// 		suffix: '';
// 	}
// }

interface StoreState {
	tasksAsTree: TheTask[];
	tags: string[];
	projects: string[];
	contexts: string[];
	defaultFileSpecified: boolean;
	activeDocumentOpened: boolean;
	filterInputValue: string;
	config: ExtensionConfig['webview'];
	selectedTaskLineNumber: number;
	/**
	 * Send improvised event from store: assign a random number and listen for changes
	 * inside the app to focus the main input element.
	 */
	focusFilterInputEvent: number;
}

export const useStore = defineStore({
	id: 'store',
	state: (): StoreState => ({
		tasksAsTree: [],
		tags: [],
		projects: [],
		contexts: [],
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
			customCSSPath: '',
			scrollbarOverflow: false,
		},
		selectedTaskLineNumber: -1,
		focusFilterInputEvent: 0,
	}),
	// ────────────────────────────────────────────────────────────
	getters: {
		filteredSortedTasks: (state): FilterTasksResult => {
			let filteredTasks = state.tasksAsTree as TheTask[];
			let matchIds: number[] = [];
			if (state.filterInputValue !== '') {
				const filtered = filterTasks(filteredTasks, state.filterInputValue || '');
				filteredTasks = filtered.tasks;
				matchIds = filtered.matchIds;
			}
			// TODO: use filterTasks()
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
					if (task.due?.isRecurring && task.due.isDue === IsDue.NotDue) {
						return false;
					} else {
						return true;
					}
				});
			}
			// ignore setting `webview.showCompleted` when `$done` filter is present
			if (!state.config.showCompleted/*  && !state.filterInputValue.includes('$done') */) {
				filteredTasks = filteredTasks.filter(task => !task.done);
				// filteredTasks = filterTasks(filteredTasks, '-$done');
			}
			// Filter out hidden tasks unless `$hidden` filter is present
			if (!state.filterInputValue.includes('$hidden')) {
				filteredTasks = filteredTasks.filter(task => !task.isHidden);
				// filteredTasks = filterTasks(filteredTasks, '-$hidden');
			}
			return {
				tasks: defaultSortTasks(filteredTasks),
				matchIds,
			};
		},
		flattenedFilteredSortedTasks(): TheTask[] {
			return flattenTasksDeep(this.filteredSortedTasks.tasks);
		},
		tasksThatDontMatchFilter(): number[] {
			if (!this.filterInputValue) {
				return [];
			}
			return difference(this.flattenedFilteredSortedTasks.map(task => task.lineNumber), this.filteredSortedTasks.matchIds);
		},
		suggestItems(state): string[] {
			return [
				...filterConstants,
				...state.tags.map(tag => `#${tag}`),
				...state.projects.map(project => `+${project}`),
				...state.contexts.map(context => `@${context}`),
			];
		},
	},
	// ────────────────────────────────────────────────────────────
	actions: {
		setEverything({
			tasksAsTree,
			config,
			defaultFileSpecified,
			activeDocumentOpened,
			tags,
			projects,
			contexts,
		}: {
			tasksAsTree: TheTask[];
			config: ExtensionConfig['webview'];
			defaultFileSpecified: boolean;
			activeDocumentOpened: boolean;
			tags: string[];
			projects: string[];
			contexts: string[];
		}) {
			this.tasksAsTree = tasksAsTree;
			this.config = config;
			this.defaultFileSpecified = defaultFileSpecified;
			this.activeDocumentOpened = activeDocumentOpened;
			this.tags = tags;
			this.projects = projects;
			this.contexts = contexts;
		},
		selectTask(lineNumber: number) {
			this.selectedTaskLineNumber = lineNumber;
		},
		selectFirstTask() {
			if (this.filteredSortedTasks.tasks.length) {
				this.selectTask(this.selectedTaskLineNumber = this.filteredSortedTasks.tasks[0].lineNumber);
			}
		},
		updateFilterValue(value: string, append = false) {
			const newValue = append ? this.filterInputValue += ` ${value}` : value;
			this.filterInputValue = newValue;
			vscodeApi.setState({
				filterInputValue: newValue,
			});
			this.updateWebviewTitle();
		},
		focusFilterInput() {
			this.focusFilterInputEvent = Math.random();
		},
		updateWebviewTitle() {
			SendMessage.updateWebviewTitle(this.flattenedFilteredSortedTasks.length, this.flattenedFilteredSortedTasks.filter(task => task.done).length);
		},
		toggleDone(task: TheTask) {
			task.done = !task.done;
			if (task.done && this.config.notificationsEnabled) {
				showToastNotification(`${task.title}`, {
					type: 'success',
				});
			}
			SendMessage.toggleDone(task.lineNumber);
		},
		selectNextTask() {
			if (!this.filteredSortedTasks.tasks.length) {
				return undefined;
			}
			let targetTask: TheTask;
			if (this.selectedTaskLineNumber === -1) {
				// None selected. Select the first visible task
				targetTask = this.filteredSortedTasks.tasks[0];
			} else {
				// Selected task exists
				const selectedTask = this.getTaskAtLine(this.selectedTaskLineNumber);

				if (!selectedTask) {
					return undefined;
				}

				const tasks = this.flattenedFilteredSortedTasks.filter(task => this.isTaskNotCollapsed(task));
				if (tasks.length < 2) {
					return undefined;
				}

				const currentIndex = tasks.findIndex(task => selectedTask.lineNumber === task.lineNumber);
				targetTask = currentIndex === tasks.length - 1 ? tasks[0] : tasks[currentIndex + 1];
			}
			this.selectTask(targetTask.lineNumber);
			return targetTask.lineNumber;
		},
		selectPrevTask() {
			if (!this.filteredSortedTasks.tasks.length) {
				return undefined;
			}
			let targetTask: TheTask;
			if (this.selectedTaskLineNumber === -1) {
				// None selected. Select the first visible task
				targetTask = this.flattenedFilteredSortedTasks[this.flattenedFilteredSortedTasks.length - 1];
			} else {
				const selectedTask = this.getTaskAtLine(this.selectedTaskLineNumber);
				if (!selectedTask) {
					return undefined;
				}

				const tasks = this.flattenedFilteredSortedTasks.filter(task => this.isTaskNotCollapsed(task));

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
			this.selectTask(targetTask.lineNumber);
			return targetTask.lineNumber;
		},
		// ──── helpers ───────────────────────────────────────────────
		getTaskAtLine(lineNumber: number, tasks?: TheTask[]): TheTask | undefined {
			for (const task of tasks || this.tasksAsTree as TheTask[]) {
				if (task.lineNumber === lineNumber) {
					return task;
				}
				if (task.subtasks.length) {
					const foundTask = this.getTaskAtLine(lineNumber, task.subtasks);
					if (foundTask) {
						return foundTask;
					}
				}
			}
			return undefined;
		},
		/**
		 * Return `true` when task is not collapsed (visible).
		 *
		 * This is **NOT** a check if task is scrolled out of view.
		 */
		isTaskNotCollapsed(task: TheTask): boolean {
			if (task.parentTaskLineNumber === undefined) {
				return true;
			}
			for (let currentTask = task; currentTask.parentTaskLineNumber !== undefined;) {
				const parentTask = this.getTaskAtLine(currentTask.parentTaskLineNumber, this.flattenedFilteredSortedTasks);
				if (!parentTask) {
					return false;
				}
				if (parentTask.isCollapsed) {
					return false;
				}
				currentTask = parentTask;
			}

			return true;
		},
		getAllNestedTasksWebview(task: TheTask): TheTask[] {
			const allNestedTaksIds = this.getNestedTasksLineNumbers(task.subtasks);
			return allNestedTaksIds.map(lineNumber => this.getTaskAtLine(lineNumber)!);
		},
		getNestedTasksLineNumbers(tasks: TheTask[]): number[] {
			const ids = [];
			for (const task of tasks) {
				ids.push(task.lineNumber);
				if (task.subtasks) {
					ids.push(...this.getNestedTasksLineNumbers(task.subtasks));
				}
			}
			return ids;
		},
	},
});

export function getState(): SavedState {
	const savedStateDefaults: SavedState = {
		filterInputValue: '',
	};
	return vscodeApi.getState() ?? savedStateDefaults;
}

window.addEventListener('message', event => {
	const message: MessageToWebview = event.data; // The json data that the extension sent
	switch (message.type) {
		case 'updateEverything': {
			const store = useStore();
			store.setEverything({
				tasksAsTree: message.value.tasksAsTree,
				config: message.value.config,
				defaultFileSpecified: message.value.defaultFileSpecified,
				activeDocumentOpened: message.value.activeDocumentOpened,
				tags: message.value.tags,
				projects: message.value.projects,
				contexts: message.value.contexts,
			});
			const bodyStyle = document.body.style;
			bodyStyle.setProperty('--font-size', message.value.config.fontSize);
			bodyStyle.setProperty('--font-family', message.value.config.fontFamily);
			bodyStyle.setProperty('--line-height', String(message.value.config.lineHeight));
			bodyStyle.setProperty('--padding', message.value.config.padding);
			bodyStyle.setProperty('--priority-left-padding', message.value.config.showPriority ? '3px' : '1px');
			bodyStyle.setProperty('--indent-size', message.value.config.indentSize);
			bodyStyle.setProperty('--list-scrollbar-value', message.value.config.scrollbarOverflow ? 'overlay' : 'auto');
			store.updateWebviewTitle();
			break;
		}
		case 'focusFilterInput': {
			const store = useStore();
			store.focusFilterInput();
			break;
		}
	}
});

/**
 * Recursive function to flatten an array.
 * Nested property name is hardcoded as `subtasks`
 */
export function flattenTasksDeep(tasks: TheTask[]): TheTask[] {
	const flattenedTasks: TheTask[] = [];
	function flatten(subtasks: TheTask[]): void {
		for (const item of subtasks) {
			flattenedTasks.push(item);
			if (item.subtasks.length) {
				flatten(item.subtasks);
			}
		}
	}
	flatten(tasks);
	return flattenedTasks;
}

