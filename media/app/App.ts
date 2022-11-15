import { marked } from 'marked';
import { mapStores } from 'pinia';
import { defineComponent } from 'vue';
import { TheTask } from '../../src/TheTask';
import Suggest from './components/Suggest/Suggest';
import SuggestComponent from './components/Suggest/Suggest.vue';
import TaskDetailsComponent from './components/TaskDetails/TaskDetails.vue';
import { getState, sendMessage, useStore } from './store';
import { VueEvents } from './webviewTypes';

/**
 * Render paragraph without actual `<p>` tag
 */
marked.Renderer.prototype.paragraph = text => `${text}`;

marked.Renderer.prototype.link = (href, title = '', text) => {
	let classes = '';
	if (text.startsWith('btn:')) {
		classes = 'btn btn--link';
		text = text.replace(/^btn:/, '');
	}

	if (href?.startsWith('command:')) {
		// let webview handle command Uri links
		return `<a href="${href}" title="${href}" class="${classes}">${text}</a>`;
	} else {
		return `<a data-href="${href}" href="javascript:void(0);" title="${href}" class="${classes}">${text}</a>`;
	}
};

export default defineComponent({
	name: 'App',
	components: {
		Suggest: SuggestComponent,
		TaskDetails: TaskDetailsComponent,
	},
	data: () => ({
		/**
		 * Task rename modal input value
		 */
		newTaskTitle: '',
		contextMenuTask: undefined as TheTask | undefined, // TheTask
		taskDetailsManuallyTriggered: false,
		options: [
			{
				name: 'wow',
			},
		],
	}),
	computed: {
		...mapStores(useStore),
		taskDetailsVisible(): boolean {
			return (this.storeStore.config.webview.showTaskDetails || this.taskDetailsManuallyTriggered) && this.storeStore.selectedTaskLineNumber !== -1;
		},
	},
	methods: {
		// ──── Context Menu ──────────────────────────────────────────
		hideContextMenu() {
			const $contextMenu = (this.$refs.taskContextMenu as HTMLElement);
			const menuWasVisible = !$contextMenu.hidden;
			$contextMenu.hidden = true;
			if (menuWasVisible) {
				this.focusFilterInput();
			}
		},
		showContextMenu(event: MouseEvent) {
			const contextMenuContainer = this.$refs.taskContextMenu as HTMLElement;
			contextMenuContainer.style.setProperty('--mouse-x', `${event.clientX}px`);
			contextMenuContainer.style.setProperty('--mouse-y', `${event.clientY}px`);
			contextMenuContainer.hidden = false;
		},
		// ──── Context Menu Items ────────────────────────────────────
		toggleHidden() {
			if (this.contextMenuTask) {
				sendMessage({
					type: 'toggleHidden',
					value: this.contextMenuTask.lineNumber,
				});
				this.hideContextMenu();
			}
		},
		deleteTask() {
			if (this.contextMenuTask) {
				sendMessage({
					type: 'deleteTask',
					value: this.contextMenuTask.lineNumber,
				});
				this.hideContextMenu();
			}
		},
		revealTask() {
			if (this.contextMenuTask) {
				sendMessage({
					type: 'revealTask',
					value: this.contextMenuTask.lineNumber,
				});
				this.hideContextMenu();
			}
		},
		toggleFavorite() {
			if (this.contextMenuTask) {
				sendMessage({
					type: 'toggleFavorite',
					value: this.contextMenuTask.lineNumber,
				});
				this.hideContextMenu();
			}
		},
		startTask() {
			if (this.contextMenuTask) {
				sendMessage({
					type: 'startTask',
					value: this.contextMenuTask.lineNumber,
				});
				this.hideContextMenu();
			}
		},
		setDueDate() {
			if (this.contextMenuTask) {
				sendMessage({
					type: 'setDueDate',
					value: this.contextMenuTask.lineNumber,
				});
				this.hideContextMenu();
			}
		},
		onTaskListScroll() {
			this.hideContextMenu();
		},
		// ────────────────────────────────────────────────────────────
		onInput(value: string) {
			this.storeStore.selectTask(-1);
			this.storeStore.updateFilterValue(value);
			this.$nextTick(() => {
				this.storeStore.selectFirstTask();
			});
		},
		onDown() {
			const ln = this.storeStore.selectNextTask();
			if (ln && ln !== -1) {
				this.scrollIntoView(ln);
			}
		},
		onUp() {
			const ln = this.storeStore.selectPrevTask();
			if (ln && ln !== -1) {
				this.scrollIntoView(ln);
			}
		},
		scrollIntoView(lineNumber: number) {
			// @ts-ignore https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoViewIfNeeded
			document.getElementById(`ln${lineNumber}`)?.scrollIntoViewIfNeeded(false);
		},
		focusFilterInput() {
			(this.$refs.suggest as typeof Suggest)?.focus();
		},
	},
	created() {
		const savedState = getState();
		this.storeStore.updateFilterValue(savedState.filterInputValue);
		sendMessage({
			type: 'webviewLoaded',
			value: true,
		});
	},
	mounted() {
		// @ts-ignore
		this.emitter.on(VueEvents.OpenTaskContextMenu, (obj: {event: MouseEvent; task: TheTask}) => {
			this.contextMenuTask = obj.task;
			this.showContextMenu(obj.event);
		});
		// @ts-ignore
		this.emitter.on(VueEvents.FocusFilterInput, () => {
			this.focusFilterInput();
		});

		window.addEventListener('focus', () => {
			this.focusFilterInput();
		});

		window.addEventListener('click', e => {
			const link = (e.target as HTMLElement).closest('a');
			if (link && link.dataset.href) {
				sendMessage({
					type: 'followLink',
					value: link.dataset.href,
				});
			}
			this.hideContextMenu();
		});

		window.addEventListener('keydown', e => {
			if (e.key === 'ArrowRight') {
				sendMessage({
					type: 'toggleTaskCollapse',
					value: this.storeStore.selectedTaskLineNumber,
				});
			} else if (e.key === 'Delete' && e.shiftKey) {
				if (this.storeStore.selectedTaskLineNumber !== -1) {
					sendMessage({
						type: 'deleteTask',
						value: this.storeStore.selectedTaskLineNumber,
					});
				}
			} else if (e.key === 'Escape') {
				this.taskDetailsManuallyTriggered = false;
				this.focusFilterInput();
				this.hideContextMenu();
			} else if (e.key === 'd' && e.altKey) {
				const task = this.storeStore.getTaskAtLine(this.storeStore.selectedTaskLineNumber);
				if (task) {
					if (task.count) {
						sendMessage({
							type: 'toggleDoneOrIncrementCount',
							value: task.lineNumber,
						});
					} else {
						this.storeStore.toggleDone(task);
					}
				}
			} else if (e.key === 'F2') {
				this.taskDetailsManuallyTriggered = true;
				setTimeout(() => {
					(this.$refs.taskDetails as typeof TaskDetailsComponent).focus();
				}, 100);
			} else if (e.key === 'Home') {
				this.storeStore.selectFirstTask();
				this.scrollIntoView(this.storeStore.selectedTaskLineNumber);
			} else if (e.key === 'End') {
				this.storeStore.selectLastTask();
				this.scrollIntoView(this.storeStore.selectedTaskLineNumber);
			}
		});
	},
	watch: {
		'storeStore.focusFilterInputEvent'() {
			this.focusFilterInput();
		},
	},
});
