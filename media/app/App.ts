import fuzzysort from 'fuzzysort';
import debounce from 'lodash/debounce';
import marked from 'marked';
import Vue from 'vue';
import VueAutosuggest from 'vue-autosuggest';
import { Component } from 'vue-property-decorator';
import { mapGetters, mapState } from 'vuex';
import { findTaskAtLine } from '../../src/taskUtils';
import { TheTask } from '../../src/TheTask';
import { IExtensionConfig } from '../../src/types';
import { selectNextTaskAction, selectPrevTaskAction, selectTaskMutation, showNotification, toggleDoneMutation, toggleTaskCollapse, updateFilterValueMutation, vscodeApi } from './store';
import TaskComponent from './Task.vue';

marked.Renderer.prototype.paragraph = text => `${text}`;

Vue.use(VueAutosuggest);
Vue.component('task', TaskComponent);// needs to be global for recursive rendering

@Component({
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

	filteredSuggestions = [];
	shouldRevokeAutoShowSuggest = false;

	showNotification = showNotification;

	$refs!: {
		autosuggest: any;
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
	}
	/**
	 * Event fired when autocomplete list is closed
	 */
	onClosed() {
		if (this.shouldRevokeAutoShowSuggest) {
			this.config.autoShowSuggest = false;
			this.shouldRevokeAutoShowSuggest = false;
		}
	}
	/**
	 * Event that is fired when typing in filter input
	 */
	onFilterInputChange(value: string) {
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
		this.onFilterInputChange(e.item);
		this.focusFilterInput();
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
	// ──────────────────────────────────────────────────────────────────────
	updateWebviewCounter(numberOfTasks: number) {
		vscodeApi.postMessage({
			type: 'updateTitle',
			value: String(numberOfTasks),
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
		window.addEventListener('keydown', async e => {
			if (e.key === 'ArrowDown') {
				const selectedTaskLineNumber = await selectNextTaskAction();
				if (selectedTaskLineNumber) {
					this.scrollIntoView(selectedTaskLineNumber);
				}
			} else if (e.key === 'ArrowUp') {
				const selectedTaskLineNumber = await selectPrevTaskAction();
				if (selectedTaskLineNumber) {
					this.scrollIntoView(selectedTaskLineNumber);
				}
			} else if (e.key === 'ArrowRight') {
				toggleTaskCollapse(this.selectedTaskLineNumber);
			} else if (e.key === 'Escape') {
				selectTaskMutation(-1);
			} else if (e.key === 'd' && e.altKey) {
				const task = findTaskAtLine(this.selectedTaskLineNumber, this.tasksAsTree);
				toggleDoneMutation(task);
			}
		});
	}
}
