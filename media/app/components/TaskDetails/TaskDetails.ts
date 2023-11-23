import debounce from 'lodash/debounce';
import { mapStores } from 'pinia';
import { defineComponent } from 'vue';
import { sendMessage, useMainStore } from '../../store';

export default defineComponent({
	name: 'TaskDetails',
	computed: {
		...mapStores(useMainStore),
	},
	data: () => ({
		inputValue: '',
	}),
	methods: {
		updateInputValueBasedOnSelectedTask() {
			this.inputValue = this.mainStore.getTaskAtLine(this.mainStore.selectedTaskLineNumber)?.rawText || '';
		},
		onTaskTitleChange(event: Event) {
			this.inputValue = (event.target as HTMLTextAreaElement).value.replace(/\n|\r/g, ' ');
			this.editSelectedTaskDebounced();
		},
		/**
		 * Resize textarea to fit the text (or compress to 1 line height)
		 */
		resizeTaskTitleTextarea() {
			setTimeout(() => {
				const textareaElement = this.$refs.detailsTaskTitle as HTMLTextAreaElement;
				if (!textareaElement) {
					return;
				}
				textareaElement.style.height = 'auto';
				textareaElement.style.height = `${textareaElement.scrollHeight}px`;
			}, 0);
		},
		editSelectedTask() {
			if (this.inputValue) {
				sendMessage({
					type: 'editTaskRawText',
					value: {
						lineNumber: this.mainStore.selectedTaskLineNumber,
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
			this.resizeTaskTitleTextarea();
			textareaElement.focus();
		},
	},
	mounted() {
		this.updateInputValueBasedOnSelectedTask();
	},
	watch: {
		'inputValue'() {
			this.resizeTaskTitleTextarea();
		},
		'mainStore.selectedTaskLineNumber'() {
			this.updateInputValueBasedOnSelectedTask();
		},
	},
});

