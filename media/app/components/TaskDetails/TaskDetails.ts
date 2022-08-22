import debounce from 'lodash/debounce';
import { mapStores } from 'pinia';
import { defineComponent } from 'vue';
import { sendMessage, useStore } from '../../store';

export default defineComponent({
	name: 'TaskDetails',
	computed: {
		...mapStores(useStore),
	},
	data: () => ({
		inputValue: '',
	}),
	methods: {
		updateInputValueBasedOnSelectedTask() {
			this.inputValue = this.storeStore.getTaskAtLine(this.storeStore.selectedTaskLineNumber)?.rawText || '';
		},
		onTaskTitleChange(event: Event) {
			this.inputValue = (event.target as HTMLTextAreaElement).value;
			this.resizeTaskTitleTextarea();
			this.editSelectedTaskDebounced();
		},
		/**
		 * Resize textarea to fit the text (or compress to 1 line height)
		 */
		resizeTaskTitleTextarea() {
			setTimeout(() => {
				const textareaElement = this.$refs.detailsTaskTitle as HTMLTextAreaElement;
				textareaElement.style.height = 'auto';
				textareaElement.style.height = `${textareaElement.scrollHeight}px`;
			}, 0);
		},
		editSelectedTask() {
			if (this.inputValue) {
				sendMessage({
					type: 'editTaskRawText',
					value: {
						lineNumber: this.storeStore.selectedTaskLineNumber,
						newRawText: this.inputValue,
					},
				});
			}
		},
		editSelectedTaskDebounced: debounce(function() {
			// @ts-ignore
			this?.editSelectedTask();
		}, 500),
		focus() {
			const textareaElement = this.$refs.detailsTaskTitle as HTMLTextAreaElement;
			textareaElement.focus();
			this.resizeTaskTitleTextarea();
		},
	},
	mounted() {
		this.updateInputValueBasedOnSelectedTask();
		setTimeout(() => {
			this.resizeTaskTitleTextarea();
		}, 100);
	},
	watch: {
		'storeStore.selectedTaskLineNumber'() {
			this.updateInputValueBasedOnSelectedTask();
			this.resizeTaskTitleTextarea();
		},
	},
});

