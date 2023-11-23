import { mapStores } from 'pinia';
import { defineComponent, PropType } from 'vue';
import type { TheTask } from '../../../../src/TheTask';
import { durationTo } from '../../../../src/time/timeUtils';
import { IsDue } from '../../../../src/types';
import { sendMessage, useMainStore } from '../../store';
import { VueEvents } from '../../webviewTypes';
import TaskTitleComponent from '../TaskTitle/TaskTitle';

export default defineComponent({
	name: 'task',
	props: {
		model: {
			type: Object as PropType<TheTask>,
			required: true,
		},
	},
	components: {
		TaskTitle: TaskTitleComponent,
	},
	data: () => ({
		duration: '00s',
		durationTimerId: 0 as any,
	}),
	methods: {
		revealTask() {
			sendMessage({
				type: 'revealTask',
				value: this.model.lineNumber,
			});
		},
		selectThisTask() {
			this.mainStore.selectTask(this.model.lineNumber);
		},
		openTaskContextMenu(e: MouseEvent, task: TheTask) {
			this.mainStore.selectTask(task.lineNumber);
			// @ts-ignore
			this.emitter.emit(VueEvents.OpenTaskContextMenu, { event: e, task });
		},
		toggleTaskCollapse() {
			sendMessage({
				type: 'toggleTaskCollapse',
				value: this.model.lineNumber,
			});
		},
		toggleTaskCollapseRecursive() {
			sendMessage({
				type: 'toggleTaskCollapseRecursive',
				value: this.model.lineNumber,
			});
		},
		toggleDone() {
			this.mainStore.toggleDone(this.model);
		},
		incrementCount() {
			sendMessage({
				type: 'toggleDoneOrIncrementCount',
				value: this.model.lineNumber,
			});
		},
		decrementCount() {
			sendMessage({
				type: 'decrementCount',
				value: this.model.lineNumber,
			});
		},
	},
	computed: {
		...mapStores(useMainStore),
		nestedCount() {
			if (this.model.subtasks.length !== 0 && this.model.parentTaskLineNumber === undefined) {
				const allNestedTasks = this.mainStore.getAllNestedTasksWebview(this.model);
				return `<span class="task__nested-count-number" title="Nested tasks count">${allNestedTasks.filter(task => task.done).length}/${allNestedTasks.length}</span>`;
			} else {
				return undefined;
			}
		},
		style() {
			if (this.model.parentTaskLineNumber !== undefined) {
				return {
					'padding-left': `calc(var(--indent-size) * ${this.model.indentLvl})`,
				};
			}
			return {};
		},
		classes() {
			const classMap: Record<string, boolean> = {};
			classMap['task--done'] = this.model.done;
			classMap['task--filter-dont-match'] = this.mainStore.tasksThatDontMatchFilter.includes(this.model.lineNumber);
			if (this.mainStore.config.webview.showPriority) {
				switch (this.model.priority) {
					case 'A': classMap['task--priA'] = true; break;
					case 'B': classMap['task--priB'] = true; break;
					case 'C': classMap['task--priC'] = true; break;
					case 'D': classMap['task--priD'] = true; break;
					case 'E': classMap['task--priE'] = true; break;
					case 'F': classMap['task--priF'] = true; break;
					case 'H': classMap['task--priH'] = true; break;
				}
			}
			if (this.model.due) {
				switch (this.model.due.isDue) {
					case IsDue.NotDue: classMap.notDue = true;break;
					case IsDue.Due: classMap.due = true;break;
					case IsDue.Overdue: classMap.overdue = true;break;
					case IsDue.Invalid: classMap.invalid = true;break;
				}
			}
			if (this.mainStore.config.webview.completedStrikeThrough) {
				classMap['task--strike-through'] = true;
			}
			if (this.mainStore.selectedTaskLineNumber === this.model.lineNumber) {
				classMap['task--selected'] = true;
			}
			return classMap;
		},
		dueDate() {
			if (this.model.due?.isDue === undefined || this.model.done) {
				return undefined;
			} else {
				const dueClasses: string[] = ['task__due-state'];
				let dueText = '';
				let dueTitle = '';
				switch (this.model.due.isDue) {
					case IsDue.NotDue: {
						dueClasses.push('task__due-state--not-due');
						dueText = `<span class="codicon codicon-milestone"></span><span class="task__days-to-count">${this.model.due.closestDueDateInTheFuture}</span>`;
						dueTitle = `In ${this.model.due.daysUntilDue} days`;
						break;
					}
					case IsDue.Due: {
						dueClasses.push('task__due-state--due');
						dueText = '<span class="codicon codicon-history"></span>';
						dueTitle = `Due Today`;
						break;
					}
					case IsDue.Overdue: {
						dueClasses.push('task__due-state--overdue');
						dueText = `<span class="codicon codicon-history"></span><span class="task__overdue-count">${this.model.due?.overdueInDays || ''}</span>`;
						dueTitle = `Overdue by ${this.model.due?.overdueInDays || '?'} days`;
						break;
					}
					case IsDue.Invalid: {
						dueClasses.push('task__due-state--invalid');
						dueText = '<span class="codicon codicon-error"></span><span class="task__days-to-count">Invalid</span>';
						dueTitle = 'Due date is Invalid';
						break;
					}
				}
				return `<span class="${dueClasses.join(' ')}" title="${dueTitle} \n\n ${this.model.due.raw}">${dueText}</span>`;
			}
		},
	},
	mounted() {
		this.duration = this.model.duration ? this.model.duration : this.model.start ? durationTo(this.model, false, this.mainStore.config.durationIncludeSeconds) : '';

		if (!this.model.duration && this.model.start && !this.model.done) {
			this.durationTimerId = setInterval(() => {
				this.duration = durationTo(this.model, false, this.mainStore.config.durationIncludeSeconds);
			}, 1000);
		}
	},
	beforeUnmount() {
		clearInterval(this.durationTimerId);
	},
});

