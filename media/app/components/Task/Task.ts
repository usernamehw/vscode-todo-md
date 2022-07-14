import { mapStores } from 'pinia';
import { defineComponent, PropType } from 'vue';
import type { TheTask } from '../../../../src/TheTask';
import { durationTo } from '../../../../src/time/timeUtils';
import { IsDue } from '../../../../src/types';
import { SendMessage } from '../../SendMessage';
import { useStore } from '../../store';
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
		duration: '',
		durationTimerId: 0 as any,
	}),
	methods: {
		revealTask() {
			SendMessage.revealTask(this.model.lineNumber);
		},
		selectThisTask() {
			this.storeStore.selectTask(this.model.lineNumber);
			// @ts-ignore
			this.emitter.emit(VueEvents.FocusFilterInput);
		},
		openTaskContextMenu(e: MouseEvent, task: TheTask) {
			this.storeStore.selectTask(task.lineNumber);
			// @ts-ignore
			this.emitter.emit(VueEvents.OpenTaskContextMenu, { event: e, task });
		},
		toggleTaskCollapse() {
			SendMessage.toggleTaskCollapse(this.model.lineNumber);
		},
		toggleTaskCollapseRecursive() {
			SendMessage.toggleTaskCollapseRecursive(this.model.lineNumber);
		},
		toggleDone() {
			this.storeStore.toggleDone(this.model);
		},
		incrementCount() {
			SendMessage.incrementCount(this.model.lineNumber);
		},
		decrementCount() {
			SendMessage.decrementCount(this.model.lineNumber);
		},
	},
	computed: {
		...mapStores(useStore),
		nestedCount() {
			if (this.model.subtasks.length !== 0 && this.model.parentTaskLineNumber === undefined) {
				const allNestedTasks = this.storeStore.getAllNestedTasksWebview(this.model);
				return `<span class="task__nested-count-number" title="Nested tasks count">${allNestedTasks.filter(task => task.done).length}/${allNestedTasks.length}</span>`;
			} else {
				return undefined;
			}
		},
		classes() {
			const classMap: Record<string, boolean> = {};
			classMap['task--done'] = this.model.done;
			classMap['task--filter-dont-match'] = this.storeStore.tasksThatDontMatchFilter.includes(this.model.lineNumber);
			classMap['task--favorite'] = this.model.favorite;
			if (this.model.parentTaskLineNumber !== undefined) {
				classMap[`task--nested-lvl-${this.model.indentLvl}`] = true;
			}
			if (this.storeStore.config.showPriority) {
				switch (this.model.priority) {
					case 'A': classMap['task--priA'] = true; break;
					case 'B': classMap['task--priB'] = true; break;
					case 'C': classMap['task--priC'] = true; break;
					case 'D': classMap['task--priD'] = true; break;
					case 'E': classMap['task--priE'] = true; break;
					case 'F': classMap['task--priF'] = true; break;
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
			if (this.storeStore.config.completedStrikeThrough) {
				classMap['task--strike-through'] = true;
			}
			if (this.storeStore.selectedTaskLineNumber === this.model.lineNumber) {
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
		this.duration = this.model.duration ? this.model.duration : this.model.start ? durationTo(this.model, false, !this.model.done) : '';// TODO: respect `durationIncludeSeconds`

		if (!this.model.duration && this.model.start && !this.model.done) {
			this.durationTimerId = setInterval(() => {
				this.duration = durationTo(this.model, false, true);
			}, 1000);
		}
	},
	beforeUnmount() {
		clearInterval(this.durationTimerId);
	},
});

