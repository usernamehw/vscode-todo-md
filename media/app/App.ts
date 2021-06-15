import fuzzysort from 'fuzzysort';
import debounce from 'lodash/debounce';
import marked from 'marked';
import Vue from 'vue';
// @ts-ignore
import VueAutosuggest from 'vue-autosuggest';
// @ts-ignore
import VueContext from 'vue-context';
import VueNotifications from 'vue-notification';
import { Component } from 'vue-property-decorator';
import { mapGetters, mapState } from 'vuex';
import { TheTask } from '../../src/TheTask';
import { ExtensionConfig } from '../../src/types';
import type TaskDetails from './components/TaskDetails';
import { SendMessage } from './SendMessage';
import { selectNextTaskAction, selectPrevTaskAction, selectTaskMutation, toggleDoneMutation, updateFilterValueMutation } from './store';
import { getTaskAtLineWebview } from './storeUtils';
import TaskComponent from './Task.vue';
import { VueEvents } from './webviewTypes';
/**
 * Render paragraph without actual `<p>` tag
 */
marked.Renderer.prototype.paragraph = text => `${text}`;

marked.Renderer.prototype.link = (href, title = '', text) => {
	let style = '';
	let role = '';
	if (text.startsWith('btn:')) {
		style = 'btn btn-link';
		text = text.replace(/^btn:/, '');
		role = 'role="button"';
	}
	return `<a href="${href}" title="${href}" class="${style}" ${role}>${text}</a>`;
};

Vue.use(VueAutosuggest);
Vue.use(VueNotifications);
Vue.component('task', TaskComponent);// needs to be global for recursive rendering

@Component({
	components: {
		VueContext,
		TaskDetails: async () => import('./components/TaskDetails.vue'),
	},
	computed: {
		...mapState(['tasksAsTree', 'filterInputValue', 'config', 'defaultFileSpecified', 'activeDocumentOpened', 'selectedTaskLineNumber']),
		...mapGetters(['filteredSortedTasks', 'autocompleteItems']),
	},
})
export default class App extends Vue {
	tasksAsTree!: TheTask[];
	filteredSortedTasks!: TheTask[];
	filterInputValue!: string;
	config!: ExtensionConfig['webview'];
	defaultFileSpecified!: boolean;
	activeDocumentOpened!: boolean;
	autocompleteItems!: any;
	/**
	 * `-1` When no task is selected.
	 */
	selectedTaskLineNumber!: number;
	/**
	 * Task rename modal input value
	 */
	newTaskTitle = '';

	contextMenuTask!: TheTask;

	filteredSuggestions: {
		data: string[];
	}[] = [];
	isSuggestVisible = false;
	/**
	 * Hack to prevent keydown event opening suggest
	 */
	shouldHideSuggest = false;
	shouldRevokeAutoShowSuggest = false;

	showNotification = SendMessage.showNotification;

	taskDetailsManuallyTriggered = false;

	get taskDetailsVisible() {
		return (this.config.showTaskDetails || this.taskDetailsManuallyTriggered) && this.selectedTaskLineNumber !== -1;
	}

	$refs!: {
		autosuggest: any;
		taskContextMenu: any;
		newTaskText: HTMLInputElement;
		taskDetails: TaskDetails;
	};
	// ──────────────────────────────────────────────────────────────────────
	/**
	 * Highlight filter matches for single autocomplete item
	 */
	fuzzyHighlight(value: string) {
		return fuzzysort.highlight(fuzzysort.single(this.filterInputValue, value) || undefined, '<mark>', '</mark>');
	}
	/**
	 * Open autocomplete on Ctrl+Space
	 */
	openSuggest() {
		if (!this.config.autoShowSuggest) {
			this.config.autoShowSuggest = true;
			this.shouldRevokeAutoShowSuggest = true;
		}
		this.shouldHideSuggest = false;
	}
	onOpenedSuggest() {
		this.isSuggestVisible = true;
	}
	onClosedSuggest() {
		this.isSuggestVisible = false;
		if (this.shouldRevokeAutoShowSuggest) {
			this.config.autoShowSuggest = false;
			this.shouldRevokeAutoShowSuggest = false;
		}
	}
	/**
	 * Event that is fired when typing in filter input
	 */
	onFilterInputChange(value: string) {
		this.shouldHideSuggest = false;
		selectTaskMutation(-1);
		updateFilterValueMutation(value);
		this.filteredSuggestions = [{
			data: fuzzysort.go(value, this.autocompleteItems[0].data).map(item => item.target),
		}];
		Vue.nextTick(() => {
			this.$refs.autosuggest.setCurrentIndex(0);
			this.selectFirstTask();
		});
		this.updateWebviewCounter(this.filteredSortedTasks.length);
	}
	onFilterChangeDebounced = debounce(this.onFilterInputChange, 100);
	/**
	 * Event fired when accepting autocomplete suggestions
	 */
	onSelected(e: { item: string }) {
		if (e) {
			this.onFilterInputChange(e.item);
			App.focusFilterInput();
		}
	}
	/**
	 * Handle Tab keypress as Autocomplete accept suggestion
	 * (only when autocomplete is visible)
	 */
	tabHandler(e: KeyboardEvent) {
		const { listeners, setCurrentIndex, setChangeItem, getItemByIndex } = this.$refs.autosuggest;
		const item = getItemByIndex(this.$refs.autosuggest.currentIndex);
		if (!item) {
			return;
		}
		e.preventDefault();
		setChangeItem(item, true);
		this.$refs.autosuggest.loading = true;
		listeners.selected(true);
	}
	async downHandler(e: KeyboardEvent) {
		if (!this.filteredSuggestions.length || this.filteredSuggestions[0].data[0] === this.filterInputValue || !this.isSuggestVisible) {
			this.shouldHideSuggest = true;
			const selectedTaskLineNumber = await selectNextTaskAction();
			if (selectedTaskLineNumber && !this.isSuggestVisible) {
				this.scrollIntoView(selectedTaskLineNumber);
				e.preventDefault();
			}
			return;
		}
	}
	async upHandler(e: KeyboardEvent) {
		if (!this.filteredSuggestions.length || this.filteredSuggestions[0].data[0] === this.filterInputValue || !this.isSuggestVisible) {
			const selectedTaskLineNumber = await selectPrevTaskAction();
			if (selectedTaskLineNumber && !this.isSuggestVisible) {
				this.scrollIntoView(selectedTaskLineNumber);
				e.preventDefault();
			}
			return;
		}
	}
	deleteTask() {
		SendMessage.deleteTask(this.contextMenuTask.lineNumber);
	}
	revealTask() {
		SendMessage.revealTask(this.contextMenuTask.lineNumber);
	}
	startTask() {
		SendMessage.startTask(this.contextMenuTask.lineNumber);
	}
	setDueDate() {
		SendMessage.setDueDate(this.contextMenuTask.lineNumber);
	}
	onTaskListScroll() {
		this.$refs.taskContextMenu.close();
	}
	// ──────────────────────────────────────────────────────────────────────
	selectFirstTask() {
		const firstTask = this.filteredSortedTasks[0];
		if (firstTask) {
			selectTaskMutation(firstTask.lineNumber);
		}
	}
	updateWebviewCounter(numberOfTasks: number) {
		SendMessage.updateWebviewTitle(numberOfTasks);
	}
	static focusFilterInput() {
		Vue.nextTick(() => {
			const suggest = document.getElementById('autosuggest__input');
			if (suggest) {
				suggest.focus();
			}
		});
	}
	focusFilterInput = App.focusFilterInput;
	scrollIntoView(lineNumber: number) {
		const element = document.getElementById(`ln${lineNumber}`);
		// @ts-ignore https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoViewIfNeeded
		element.scrollIntoViewIfNeeded(false);
	}
	// ──────────────────────────────────────────────────────────────────────
	mounted() {
		App.focusFilterInput();
		window.addEventListener('focus', App.focusFilterInput);
		setTimeout(() => {
			this.selectFirstTask();
		}, 100);

		this.$root.$on(VueEvents.openTaskContextMenu, (data: {e: MouseEvent; task: TheTask}) => {
			this.contextMenuTask = data.task;
			this.$refs.taskContextMenu.open(data.e);
		});
		this.$root.$on(VueEvents.focusFilterInput, () => {
			App.focusFilterInput();
		});

		window.addEventListener('click', e => {
			const link = (e.target as HTMLElement).closest('a');
			if (link && link.href.startsWith('file:///')) {
				SendMessage.openInEditor(link.href);
			}
		});

		window.addEventListener('keydown', e => {
			if (e.key === 'ArrowRight') {
				SendMessage.toggleTaskCollapse(this.selectedTaskLineNumber);
			} else if (e.key === 'Delete' && e.shiftKey) {
				if (this.selectedTaskLineNumber !== -1) {
					SendMessage.deleteTask(this.selectedTaskLineNumber);
				}
			} else if (e.key === 'Escape') {
				selectTaskMutation(-1);
				this.taskDetailsManuallyTriggered = false;
				this.focusFilterInput();
			} else if (e.key === 'd' && e.altKey) {
				const task = getTaskAtLineWebview(this.selectedTaskLineNumber);
				if (task) {
					toggleDoneMutation(task);
				}
			} else if (e.key === 'F2') {
				this.taskDetailsManuallyTriggered = true;
				setTimeout(() => {
					this.$refs.taskDetails.$refs.detailsTaskTitle.focus();
				}, 100);
			}
		});
	}
}
