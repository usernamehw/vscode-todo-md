import debounce from 'lodash/debounce';
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import { mapState } from 'vuex';
import { TheTask } from '../../../src/TheTask';
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


	selectedModifiedTask: TheTask | undefined;

	$refs!: {
		detailsTaskTitle: HTMLTextAreaElement;
	};

	get selectedTaskForDetails(): TheTask {
		let selectedTask: TheTask;
		if (this.selectedTaskLineNumber !== -1) {
			selectedTask = getTaskAtLineWebview(this.selectedTaskLineNumber)!;
		} else {
			// this.editSelectedTask.cancel();
			// @ts-ignore
			selectedTask = {};
			this.selectedModifiedTask = undefined;
		}
		return selectedTask;
	}

	onTaskTitleChange(event: Event) {
		const text: string = (event.target as any).value;
		let modifiedOrSelected;
		if (this.selectedModifiedTask) {
			modifiedOrSelected = this.selectedModifiedTask;
		} else {
			const selectedTask = getTaskAtLineWebview(this.selectedTaskLineNumber);
			if (!selectedTask) {
				return;
			}
			modifiedOrSelected = selectedTask;
		}
		this.selectedModifiedTask = {
			...modifiedOrSelected,
			title: text.replace(/\n/g, ' '),
		};
		this.resizeTaskTitleTextarea();
		this.editSelectedTask();
	}
	/**
	 * Resize textarea to fit the text (or compress to 1 line height)
	 */
	resizeTaskTitleTextarea() {
		setTimeout(() => {
			this.$refs.detailsTaskTitle.style.height = 'auto';
			const height = [42, 41].includes(this.$refs.detailsTaskTitle.scrollHeight) ? parseInt(this.config.fontSize, 10) * this.config.lineHeight + 6 : this.$refs.detailsTaskTitle.scrollHeight;
			this.$refs.detailsTaskTitle.style.height = `${height}px`;
		}, 0);
	}
	editSelectedTask = debounce(function() {
		// @ts-ignore
		SendMessage.editTask(this.selectedModifiedTask);
	}, 500);

	mounted() {
		// setTimeout(() => {
		// 	this.resizeTaskTitleTextarea();
		// }, 100);
	}
}
