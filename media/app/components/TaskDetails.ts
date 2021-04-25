import debounce from 'lodash/debounce';
import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';
import { mapState } from 'vuex';
import { ExtensionConfig } from '../../../src/types';
import { SendMessage } from '../SendMessage';
import { getTaskAtLineWebview } from '../storeUtils';


@Component({
	computed: {
		...mapState(['config', 'selectedTaskLineNumber']),
	},
})
export default class TaskDetails extends Vue {
	config!: ExtensionConfig['webview'];
	selectedTaskLineNumber!: number;

	inputValue = '';

	$refs!: {
		detailsTaskTitle: HTMLTextAreaElement;
	};

	updateInputValueBasedOnSelectedTask() {
		this.inputValue = getTaskAtLineWebview(this.selectedTaskLineNumber)?.rawText || '';
	}

	onTaskTitleChange(event: Event) {
		this.inputValue = (event.target as HTMLTextAreaElement).value;
		this.resizeTaskTitleTextarea();
		this.editSelectedTask();
	}
	/**
	 * Resize textarea to fit the text (or compress to 1 line height)
	 */
	resizeTaskTitleTextarea() {
		setTimeout(() => {
			this.$refs.detailsTaskTitle.style.height = 'auto';
			this.$refs.detailsTaskTitle.style.height = `${this.$refs.detailsTaskTitle.scrollHeight}px`;
		}, 0);
	}
	editSelectedTask = debounce(function() {
		// @ts-ignore
		if (this.inputValue) {
			// @ts-ignore
			SendMessage.editRawText(this.selectedTaskLineNumber, this.inputValue);
		}
	}, 500);

	@Watch('selectedTaskLineNumber')
	selectedTaskChanged() {
		this.updateInputValueBasedOnSelectedTask();
		this.resizeTaskTitleTextarea();
	}

	mounted() {
		this.updateInputValueBasedOnSelectedTask();
		setTimeout(() => {
			this.resizeTaskTitleTextarea();
		}, 100);
	}
}
