import fuzzysort from 'fuzzysort';
import debounce from 'lodash/debounce';
import marked from 'marked';
import Vue from 'vue';
import VueAutosuggest from 'vue-autosuggest';
import { Component } from 'vue-property-decorator';
import { mapGetters, mapState } from 'vuex';
import { TheTask } from '../../src/TheTask';
import { IExtensionConfig } from '../../src/types';
import { updateFilterValueMutation, vscodeApi } from './store';
import TaskComponent from './Task.vue';

marked.Renderer.prototype.paragraph = text => `${text}`;

Vue.use(VueAutosuggest);
Vue.component('task', TaskComponent);// needs to be global for recursive rendering

@Component({
	computed: {
		...mapState(['filterInputValue', 'config', 'defaultFileSpecified', 'activeDocumentOpened']),
		...mapGetters(['filteredSortedTasks', 'autocompleteItems']),
	},
})
export default class App extends Vue {
	filteredSortedTasks!: TheTask[];
	filterInputValue!: string;
	config!: IExtensionConfig['webview'];
	defaultFileSpecified!: boolean;
	activeDocumentOpened!: boolean;
	autocompleteItems!: any;

	filteredSuggestions = [];
	shouldRevokeAutoShowSuggest = false;

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
	 * Event of accepting autocomplete suggestions
	 */
	onSelect(e: { item: string }) {
		this.onFilterInputChange(e.item);
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
	showNotification(text: string) {
		vscodeApi.postMessage({
			type: 'showNotification',
			value: text,
		});
	}
	// ──────────────────────────────────────────────────────────────────────
	mounted() {
		Vue.nextTick(() => {
			const suggest = document.getElementById('autosuggest__input');
			suggest.focus();
		});
	}
}
