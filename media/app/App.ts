import fuzzysort from 'fuzzysort';
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

	$refs!: {
		autosuggest: any;
	};
	// ──────────────────────────────────────────────────────────────────────
	fuzzyHighlight(value: string) {
		return fuzzysort.highlight(fuzzysort.single(this.filterInputValue, value), '<mark>', '</mark>');
	}
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
	onSelect(e: { item: string }) {
		this.onFilterInputChange(e.item);
	}
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
