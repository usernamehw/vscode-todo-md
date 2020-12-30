import fuzzysort from 'fuzzysort';
import debounce from 'lodash/debounce';
import marked from 'marked';
import Vue from 'vue';
import VueAutosuggest from 'vue-autosuggest';
import VueContext from 'vue-context';
import VModal from 'vue-js-modal';
import VueNotifications from 'vue-notification';
import { Component } from 'vue-property-decorator';
import { mapGetters, mapState } from 'vuex';
import { TheTask } from '../../src/TheTask';
import { IExtensionConfig } from '../../src/types';
import { deleteTask, selectNextTaskAction, selectPrevTaskAction, selectTaskMutation, showNotification, toggleDoneMutation, toggleTaskCollapse, updateFilterValueMutation, vscodeApi } from './store';
import { findTaskAtLineWebview } from './storeUtils';
import TaskComponent from './Task.vue';
import { VueEvents } from './webviewTypes';

marked.Renderer.prototype.paragraph = text => `${text}`;

Vue.use(VueAutosuggest);
Vue.use(VueNotifications);
Vue.use(VModal);
Vue.component('task', TaskComponent);// needs to be global for recursive rendering

@Component({
	components: {
		VueContext,
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
	config!: IExtensionConfig['webview'];
	defaultFileSpecified!: boolean;
	activeDocumentOpened!: boolean;
	autocompleteItems!: any;
	selectedTaskLineNumber!: number;

	contextMenuTask: TheTask;

	filteredSuggestions: {
		data: string[];
	}[] = [];
	isSuggestVisible = false;
	/**
	 * Hack to prevent keydown event opening suggest
	 */
	shouldHideSuggest = false;
	shouldRevokeAutoShowSuggest = false;

	showNotification = showNotification;

	$refs!: {
		autosuggest: any;
		taskContextMenu: any;
	};
	// ──────────────────────────────────────────────────────────────────────
	/**
	 * Highlight filter matches for single autocomplete item
	 */
	fuzzyHighlight(value: string) {
		return fuzzysort.highlight(fuzzysort.single(this.filterInputValue, value), '<mark>', '</mark>');
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
			this.focusFilterInput();
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
		deleteTask(this.contextMenuTask.lineNumber);
	}
	onTaskListScroll() {
		this.$refs.taskContextMenu.close();
	}
	// ──────────────────────────────────────────────────────────────────────
	updateWebviewCounter(numberOfTasks: number) {
		vscodeApi.postMessage({
			type: 'updateTitle',
			value: numberOfTasks,
		});
	}
	focusFilterInput() {
		Vue.nextTick(() => {
			const suggest = document.getElementById('autosuggest__input');
			suggest.focus();
		});
	}
	scrollIntoView(lineNumber: number) {
		const element = document.getElementById(`ln${lineNumber}`);
		// @ts-ignore https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoViewIfNeeded
		element.scrollIntoViewIfNeeded(false);
	}
	// ──────────────────────────────────────────────────────────────────────
	mounted() {
		this.focusFilterInput();
		window.addEventListener('focus', this.focusFilterInput);

		this.$root.$on(VueEvents.openTaskContextMenu, (data: {e: MouseEvent; task: TheTask}) => {
			this.contextMenuTask = data.task;
			this.$refs.taskContextMenu.open(data.e);
		});

		window.addEventListener('keydown', e => {
			if (e.key === 'ArrowRight') {
				toggleTaskCollapse(this.selectedTaskLineNumber);
			} else if (e.key === 'Delete') {
				if (this.selectedTaskLineNumber !== -1) {
					deleteTask(this.selectedTaskLineNumber);
				}
			} else if (e.key === 'Escape') {
				selectTaskMutation(-1);
			} else if (e.key === 'd' && e.altKey) {
				const task = findTaskAtLineWebview(this.selectedTaskLineNumber);
				toggleDoneMutation(task);
			}
		});
	}
}
