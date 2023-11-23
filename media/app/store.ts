import difference from 'lodash/difference';
import { createPinia, defineStore } from 'pinia';
import { showToastNotification } from '..';
import type { TheTask } from '../../src/TheTask';
import { FILTER_CONSTANTS, FilterTasksResult, filterTasks } from '../../src/filter';
import { SortProperty, sortTasks } from '../../src/sort';
import { ExtensionConfig, IsDue, ItemWithCount, MessageFromWebview, MessageToWebview } from '../../src/types';
import { SuggestItem } from './components/Suggest/Suggest';

interface SavedState {
	filterInputValue: string;
	sortProperty: SortProperty;
}
interface VscodeWebviewApi {
	getState(): SavedState;
	setState(state: SavedState): void;
	postMessage(message: MessageFromWebview): void;
}
/** @ts-ignore */
// eslint-disable-next-line no-undef
export const vscodeApi: VscodeWebviewApi = acquireVsCodeApi();
export function sendMessage(message: MessageFromWebview): void {
	vscodeApi.postMessage(message);
}
window.onerror = function(message, source, lineno, colno, error) {
	sendMessage({
		type: 'showNotification',
		value: `[WEBVIEW] ${message}`,
	});
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
	projectsWithCount: ItemWithCount[];
	tagsWithCount: ItemWithCount[];
	contextsWithCount: ItemWithCount[];
	defaultFileSpecified: boolean;
	activeDocumentOpened: boolean;
	config: ExtensionConfig;
	selectedTaskLineNumber: number;
	// ────────────────────────────────────────────────────────────
	filterInputValue: string;
	sortProperty: SortProperty;
	// ────────────────────────────────────────────────────────────
	// Send improvised event from store: assign a random number and listen for changes
	// inside the app to focus the main input element.
	focusFilterInputEvent: number;
	selectFilterInputTextEvent: number;
	showAddNewTaskModalEvent: number;
	everythingWasUpdatedEvent: number;
	pickSortEvent: number;
}

export const useStore = defineStore({
	id: 'store',
	state: (): StoreState => ({
		tasksAsTree: [],
		tags: [],
		projects: [],
		contexts: [],
		projectsWithCount: [],
		tagsWithCount: [],
		contextsWithCount: [],
		defaultFileSpecified: true,
		activeDocumentOpened: false,
		// ────────────────────────────────────────────────────────────
		// saved between reloads
		filterInputValue: '',
		sortProperty: 'Default',
		// ────────────────────────────────────────────────────────────
		config: {
			webview: {
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
			savedFilters: [],
		} as any,
		selectedTaskLineNumber: -1,
		focusFilterInputEvent: 0,
		selectFilterInputTextEvent: 0,
		showAddNewTaskModalEvent: 0,
		everythingWasUpdatedEvent: 0,
		pickSortEvent: 0,
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
			if (!state.config.webview.showRecurringCompleted) {
				filteredTasks = filteredTasks.filter(task => {
					if (task.due?.isRecurring && task.done) {
						return false;
					} else {
						return true;
					}
				});
			}
			if (!state.config.webview.showRecurringUpcoming) {
				filteredTasks = filteredTasks.filter(task => {
					if (task.due?.isRecurring && task.due.isDue === IsDue.NotDue) {
						return false;
					} else {
						return true;
					}
				});
			}
			// ignore setting `webview.showCompleted` when `$done` filter is present
			if (!state.config.webview.showCompleted/*  && !state.filterInputValue.includes('$done') */) {
				filteredTasks = filteredTasks.filter(task => !task.done);
				// filteredTasks = filterTasks(filteredTasks, '-$done');
			}
			// Filter out hidden tasks unless `$hidden` filter is present
			if (!state.filterInputValue.includes('$hidden')) {
				filteredTasks = filteredTasks.filter(task => !(task.isHidden && task.due?.isDue !== IsDue.Due && task.due?.isDue !== IsDue.Overdue));
				// filteredTasks = filterTasks(filteredTasks, '-$hidden');
			}
			return {
				tasks: sortTasks({
					tasks: filteredTasks,
					sortProperty: state.sortProperty,
				}),
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
		suggestItems(state): SuggestItem[] {
			return [
				...Object.values(FILTER_CONSTANTS).map(constant => ({ title: constant })),
				...state.tags.map(tag => ({ title: `#${tag}`, description: state.tagsWithCount.find(t => t.title === tag)?.count })),
				...state.projects.map(project => ({ title: `+${project}`, description: state.projectsWithCount.find(p => p.title === project)?.count })),
				...state.contexts.map(context => ({ title: `@${context}`, description: state.contextsWithCount.find(c => c.title === context)?.count })),
				...state.config.savedFilters.map(filter => ({ title: filter.title, description: 'saved filter', extra: filter.filter })),
			] as SuggestItem[];
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
			projectsWithCount,
			tagsWithCount,
			contextsWithCount,
		}: {
			tasksAsTree: TheTask[];
			config: ExtensionConfig;
			defaultFileSpecified: boolean;
			activeDocumentOpened: boolean;
			tags: string[];
			projects: string[];
			contexts: string[];
			projectsWithCount: ItemWithCount[];
			tagsWithCount: ItemWithCount[];
			contextsWithCount: ItemWithCount[];
		}) {
			this.tasksAsTree = tasksAsTree;
			this.config = config;
			this.defaultFileSpecified = defaultFileSpecified;
			this.activeDocumentOpened = activeDocumentOpened;
			this.tags = tags;
			this.projects = projects;
			this.contexts = contexts;
			this.projectsWithCount = projectsWithCount;
			this.tagsWithCount = tagsWithCount;
			this.contextsWithCount = contextsWithCount;
			this.everythingWasUpdatedEvent = Math.random();
		},
		selectTask(lineNumber: number) {
			this.selectedTaskLineNumber = lineNumber;
			if (this.config.webview.focusFilterInputOnClick) {
				this.focusFilterInput();
			}
		},
		selectFirstTask() {
			if (this.filteredSortedTasks.tasks.length) {
				this.selectTask(this.filteredSortedTasks.tasks[0].lineNumber);
				this.focusFilterInput();
			}
		},
		selectLastTask() {
			if (this.flattenedFilteredSortedTasks.length) {
				this.selectTask(this.flattenedFilteredSortedTasks[this.flattenedFilteredSortedTasks.length - 1].lineNumber);
				this.focusFilterInput();
			}
		},
		updateFilterValue(value: string, append = false) {
			const newValue = append ? this.filterInputValue += ` ${value}` : value;
			this.filterInputValue = newValue;
			vscodeApi.setState({
				filterInputValue: newValue,
				sortProperty: this.sortProperty,
			});
			this.updateWebviewTitle();
		},
		updateSortProperty(sortProperty: SortProperty) {
			this.sortProperty = sortProperty;
			vscodeApi.setState({
				filterInputValue: this.filterInputValue,
				sortProperty,
			});
		},
		focusFilterInput() {
			this.focusFilterInputEvent = Math.random();
		},
		addNewTaskModal() {
			this.showAddNewTaskModalEvent = Math.random();
		},
		updateWebviewTitle() {
			sendMessage({
				type: 'updateWebviewTitle',
				value: {
					numberOfCompletedTasks: this.flattenedFilteredSortedTasks.filter(task => task.done).length,
					numberOfTasks: this.flattenedFilteredSortedTasks.length,
				},
			});
		},
		toggleDone(task: TheTask) {
			if (
				!task.done &&
				task.parentTaskLineNumber === undefined &&
				!this.config.webview.showCompleted
			) {
				this.selectCloseTask(task.lineNumber);
			}
			task.done = !task.done;
			if (task.done && this.config.webview.notificationsEnabled) {
				showToastNotification(`${task.title}`, {
					type: 'success',
				});
			}
			setTimeout(() => {
				sendMessage({
					type: 'toggleDone',
					value: task.lineNumber,
				});
			});
		},
		/**
		 * When completing a task and it's not visible by default the first task becomes focused
		 * This changes it to select next task or previous if completed task was last
		 */
		selectCloseTask(lineNumber: number) {
			if (this.filteredSortedTasks.tasks.length <= 1) {
				return;
			}
			if (lineNumber === this.filteredSortedTasks.tasks[0].lineNumber) {
				// first visible task selected
				this.selectNextTask();
			} else if (lineNumber === this.filteredSortedTasks.tasks[this.filteredSortedTasks.tasks.length - 1].lineNumber) {
				// last visible task selected
				this.selectPrevTask(lineNumber);
			} else {
				const task = this.getTaskAtLine(lineNumber);
				if (task?.subtasks.length) {
					// Task with subtasks => subtasks will become hidden => select the next task at root
					const allNested = this.getAllNestedTasksWebview(task);
					this.selectNextTask(allNested[allNested.length - 1].lineNumber);
				} else {
					this.selectNextTask(lineNumber);
				}
			}
		},
		selectNextTask(selectedLineNumber?: number) {
			if (selectedLineNumber === undefined) {
				selectedLineNumber = this.selectedTaskLineNumber;
			}
			if (!this.filteredSortedTasks.tasks.length) {
				return undefined;
			}
			let targetTask: TheTask;
			if (selectedLineNumber === -1) {
				// None selected. Select the first visible task
				targetTask = this.filteredSortedTasks.tasks[0];
			} else {
				// Selected task exists
				const selectedTask = this.getTaskAtLine(selectedLineNumber);

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
		selectPrevTask(selectedLineNumber?: number) {
			if (selectedLineNumber === undefined) {
				selectedLineNumber = this.selectedTaskLineNumber;
			}
			if (!this.filteredSortedTasks.tasks.length) {
				return undefined;
			}
			let targetTask: TheTask;
			if (selectedLineNumber === -1) {
				// None selected. Select the first visible task
				targetTask = this.flattenedFilteredSortedTasks[this.flattenedFilteredSortedTasks.length - 1];
			} else {
				const selectedTask = this.getTaskAtLine(selectedLineNumber);
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
		sortProperty: 'Default',
	};
	return {
		...vscodeApi.getState(),
		...savedStateDefaults,
	};
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
				projectsWithCount: message.value.projectsWithCount,
				tagsWithCount: message.value.tagsWithCount,
				contextsWithCount: message.value.contextsWithCount,
			});
			const bodyStyle = document.body.style;
			bodyStyle.setProperty('--font-size', message.value.config.webview.fontSize);
			bodyStyle.setProperty('--font-family', message.value.config.webview.fontFamily);
			bodyStyle.setProperty('--line-height', String(message.value.config.webview.lineHeight));
			bodyStyle.setProperty('--padding', message.value.config.webview.padding);
			bodyStyle.setProperty('--priority-left-padding', message.value.config.webview.showPriority ? '3px' : '1px');
			bodyStyle.setProperty('--indent-size', message.value.config.webview.indentSize);
			store.updateWebviewTitle();
			if (store.selectedTaskLineNumber === -1) {
				store.selectFirstTask();
			}
			break;
		}
		case 'focusFilterInput': {
			const store = useStore();
			if (message.value?.fillInputValue) {
				store.updateFilterValue(message.value.fillInputValue);
			}

			store.focusFilterInput();

			setTimeout(() => {
				if (message.value?.selectInputText) {
					store.selectFilterInputTextEvent = Math.random();
				}
			});
			break;
		}
		case 'showAddNewTaskModal': {
			const store = useStore();
			store.addNewTaskModal();
			break;
		}
		case 'pickSort': {
			const store = useStore();
			store.pickSortEvent = Math.random();
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

