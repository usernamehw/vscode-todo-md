import throttle from 'lodash/throttle';
import { marked } from 'marked';
import { mapStores } from 'pinia';
import { defineComponent } from 'vue';
import { TheTask } from '../../src/TheTask';
import Suggest from './components/Suggest/Suggest';
import SuggestComponent from './components/Suggest/Suggest.vue';
import TaskDetailsComponent from './components/TaskDetails/TaskDetails.vue';
import { getState, sendMessage, useMainStore } from './store';
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

marked.use({
	gfm: true,
});

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
		// ──── New Task ──────────────────────────────────────────────
		isNewTaskModalVisible: false,
		isPickSortModalVisible: false,
		newTaskAt: 'root' as 'root' | 'subtask',
		newTaskAsText: '',
	}),
	computed: {
		...mapStores(useMainStore),
		taskDetailsVisible(): boolean {
			return (this.mainStore.config.webview.showTaskDetails || this.taskDetailsManuallyTriggered) && this.mainStore.selectedTaskLineNumber !== -1;
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
		onTaskListScroll: throttle(function() {
			// @ts-ignore
			this.hideContextMenu();
			// App header box shadow to indicate that task list container is scrolled
			// @ts-ignore
			const $taskList = (this.$refs.taskList as HTMLElement);
			const $appHeader = document.getElementById('suggest-container')!;
			if ($taskList?.scrollTop > 0) {
				$appHeader.classList.add('app-header--box-shadow');
			} else {
				$appHeader.classList.remove('app-header--box-shadow');
			}
		}, 50),
		// ──── New Task ──────────────────────────────────────────────
		showAddNewTaskModal() {
			this.newTaskAsText = '';
			this.isNewTaskModalVisible = true;
			setTimeout(() => {
				(this.$refs.newTaskInput as HTMLInputElement).focus();
			}, 100);
		},
		pickSort() {
			this.isPickSortModalVisible = true;
		},
		hideAddNewTaskModal() {
			this.isNewTaskModalVisible = false;
		},
		hidePickSortModal() {
			this.isPickSortModalVisible = false;
		},
		addTask() {
			sendMessage({
				type: 'addNewTask',
				value: {
					rawTaskText: this.newTaskAsText,
					parentTaskLineNumber: this.newTaskAt === 'root' ? undefined : this.mainStore.selectedTaskLineNumber,
				},
			});
			this.isNewTaskModalVisible = false;
		},
		modalClosed() {
			this.focusFilterInput();
		},
		// ────────────────────────────────────────────────────────────
		onInput(value: string) {
			this.mainStore.selectTask(-1);
			this.mainStore.updateFilterValue(value);
			this.$nextTick(() => {
				this.mainStore.selectFirstTask();
				this.highlightMatchesThrottled();
				this.onTaskListScroll();// hide shadow indicating scroll on header
			});
		},
		/**
		 * Highglight text inside of task title matching filter input value.
		 */
		highlightFilterMatches() {
			// https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API
			// @ts-ignore
			if (!CSS.highlights) {
				// 'CSS Custom Highlight API not supported.';
				return;
			}

			const filterValue = this.mainStore.filterInputValue.trim().toLowerCase();
			if (!filterValue) {
				// @ts-ignore
				CSS.highlights.clear();
				return;
			}


			const allTextNodes = [];
			for (const taskTitleEl of Array.from(document.querySelectorAll('.task__title') ?? [])) {
				const treeWalker = document.createTreeWalker(taskTitleEl, NodeFilter.SHOW_TEXT);
				let currentNode = treeWalker.nextNode();
				while (currentNode) {
					allTextNodes.push(currentNode);
					currentNode = treeWalker.nextNode();
				}
			}

			// @ts-ignore
			CSS.highlights.clear();

			// Highlight only matches that are text, not special entities
			const filterParts = filterValue.split(' ').filter(filterPart => {
				if (
					filterPart.startsWith('#') ||
					filterPart.startsWith('+') ||
					filterPart.startsWith('@') ||
					filterPart.startsWith('$') ||
					filterPart.startsWith('-') ||
					filterPart.startsWith('<') ||
					filterPart.startsWith('>') ||
					filterPart === ''
				) {
					return false;
				}
				return true;
			});

			const ranges: Range[][] = [];

			for (const filterPart of filterParts) {
				// Iterate over all text nodes and find matches.
				ranges.push(
					...allTextNodes
						.map(el => ({ el, text: el.textContent!.toLowerCase() }))
						.map(({ text, el }) => {
							if (
								el.parentElement?.closest('.task__tag') ||
								el.parentElement?.closest('.task__project') ||
								el.parentElement?.closest('.task__context')
							) {
								// Don't highlight text inside of tag/project/context
								return [new Range()];
							}

							const indices: number[] = [];
							let startPos = 0;
							while (startPos < text.length) {
								const index = text.indexOf(filterPart, startPos);
								if (index === -1) {
									break;
								}
								indices.push(index);
								startPos = index + filterPart.length;
							}

							return indices.map(index => {
								const range = new Range();
								range.setStart(el, index);
								range.setEnd(el, index + filterPart.length);
								return range;
							});
						}),
				);
			}

			// @ts-ignore
			// eslint-disable-next-line no-undef
			const searchResultsHighlight = new Highlight(...ranges.flat());

			// @ts-ignore
			CSS.highlights.set('search-results', searchResultsHighlight);
		},
		highlightMatchesThrottled: throttle(function() {
			// @ts-ignore
			this.highlightFilterMatches();
		}, 100),
		onDown() {
			const ln = this.mainStore.selectNextTask();
			if (ln && ln !== -1) {
				this.scrollIntoView(ln);
			}
		},
		onUp() {
			const ln = this.mainStore.selectPrevTask();
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
		selectFilterInputText() {
			(this.$refs.suggest as typeof Suggest)?.selectInputText();
		},
	},
	created() {
		const savedState = getState();
		this.mainStore.updateFilterValue(savedState.filterInputValue);
		this.mainStore.updateSortProperty(savedState.sortProperty);
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
					value: this.mainStore.selectedTaskLineNumber,
				});
			} else if (e.key === 'Delete' && e.shiftKey) {
				if (this.mainStore.selectedTaskLineNumber !== -1) {
					sendMessage({
						type: 'deleteTask',
						value: this.mainStore.selectedTaskLineNumber,
					});
				}
			} else if (e.key === 'Escape') {
				this.taskDetailsManuallyTriggered = false;
				this.focusFilterInput();
				this.hideContextMenu();
			} else if (e.key === 'd' && e.altKey) {
				const task = this.mainStore.getTaskAtLine(this.mainStore.selectedTaskLineNumber);
				if (task) {
					if (task.count) {
						sendMessage({
							type: 'toggleDoneOrIncrementCount',
							value: task.lineNumber,
						});
					} else {
						/** Task will be gone => select next one */
						const shouldSelectNextTask = this.mainStore.config.webview.showCompleted &&
							!this.mainStore.config.webview.showRecurringCompleted &&
							task.due?.isRecurring && !task.done;
						if (shouldSelectNextTask) {
							this.mainStore.selectNextTask(task.lineNumber);
						}
						this.mainStore.toggleDone(task);
					}
				}
			} else if (e.key === 'F2') {
				this.taskDetailsManuallyTriggered = true;
				setTimeout(() => {
					(this.$refs.taskDetails as typeof TaskDetailsComponent).focus();
				}, 100);
			} else if (e.key === 'Home') {
				this.mainStore.selectFirstTask();
				this.scrollIntoView(this.mainStore.selectedTaskLineNumber);
			} else if (e.key === 'End') {
				this.mainStore.selectLastTask();
				this.scrollIntoView(this.mainStore.selectedTaskLineNumber);
			} else if (e.key === 'Insert') {
				if (e.ctrlKey) {
					this.newTaskAt = 'subtask';
				} else {
					this.newTaskAt = 'root';
				}
				this.showAddNewTaskModal();
			}
		});
	},
	watch: {
		'mainStore.focusFilterInputEvent'() {
			this.focusFilterInput();
		},
		'mainStore.selectFilterInputTextEvent'() {
			this.selectFilterInputText();
		},
		'mainStore.showAddNewTaskModalEvent'() {
			this.showAddNewTaskModal();
		},
		'mainStore.pickSortEvent'() {
			this.pickSort();
		},
		'mainStore.everythingWasUpdatedEvent'() {
			// Usually done on startup or when typing in the document
			this.$nextTick(() => {
				this.highlightMatchesThrottled();
			});
		},
	},
});
