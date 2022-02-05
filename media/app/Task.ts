import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { mapState } from 'vuex';
import { TheTask } from '../../src/TheTask';
import { durationTo } from '../../src/time/timeUtils';
import { DueState, ExtensionConfig } from '../../src/types';
import TaskTitleComponent from './components/TaskTitle';
import { SendMessage } from './SendMessage';
import { selectTaskMutation, toggleDoneMutation } from './store';
import { getAllNestedTasksWebview } from './storeUtils';
import { VueEvents } from './webviewTypes';

@Component({
	computed: {
		...mapState(['config', 'filterInputValue', 'selectedTaskLineNumber']),
	},
	components: {
		TaskTitle: TaskTitleComponent,
	},
})
export default class Task extends Vue {
	@Prop()
	private readonly model!: TheTask;

	config!: ExtensionConfig['webview'];
	filterInputValue!: string;
	selectedTaskLineNumber!: number;

	duration = this.model.start ? durationTo(this.model, false, !this.model.done) : '';// TODO: respect `durationIncludeSeconds`
	durationTimerId: any;

	toggleTaskCollapse = () => {
		SendMessage.toggleTaskCollapse(this.model.lineNumber);
	};
	toggleTaskCollapseRecursive = () => {
		SendMessage.toggleTaskCollapseRecursive(this.model.lineNumber);
	};
	// ──────────────────────────────────────────────────────────────────────
	openTaskContextMenu(e: MouseEvent, task: TheTask) {
		selectTaskMutation(task.lineNumber);
		this.$root.$emit(VueEvents.openTaskContextMenu, {
			e,
			task,
		});
	}
	selectThisTask() {
		selectTaskMutation(this.model.lineNumber);
		this.$root.$emit(VueEvents.focusFilterInput);
	}
	toggleDone() {
		toggleDoneMutation(this.model);
	}
	revealTask() {
		SendMessage.revealTask(this.model.lineNumber);
	}
	incrementCount() {
		SendMessage.incrementCount(this.model.lineNumber);
	}
	decrementCount() {
		SendMessage.decrementCount(this.model.lineNumber);
	}
	// ──────────────────────────────────────────────────────────────────────
	/**
	 * Computed classes assigned to `task` element
	 */
	get classes() {
		const classMap: Record<string, boolean> = {};
		classMap['task--done'] = this.model.done;
		if (this.model.parentTaskLineNumber !== undefined) {
			classMap[`task--nested-lvl-${this.model.indentLvl}`] = true;
		}
		if (this.config.showPriority) {
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
				case DueState.notDue: classMap.notDue = true;break;
				case DueState.due: classMap.due = true;break;
				case DueState.overdue: classMap.overdue = true;break;
				case DueState.invalid: classMap.invalid = true;break;
			}
		}
		if (this.config.completedStrikeThrough) {
			classMap['task--strike-through'] = true;
		}
		if (this.selectedTaskLineNumber === this.model.lineNumber) {
			classMap['task--selected'] = true;
		}
		return classMap;
	}
	get dueDate() {
		if (this.model.due?.isDue === undefined || this.model.done) {
			return undefined;
		} else {
			const dueClasses: string[] = ['task__due-state'];
			let dueText = '';
			let dueTitle = '';
			switch (this.model.due.isDue) {
				case DueState.notDue: {
					dueClasses.push('task__due-state--not-due');
					dueText = `<span class="codicon codicon-milestone"></span><span class="task__days-to-count">${this.model.due.closestDueDateInTheFuture}</span>`;
					dueTitle = `In ${this.model.due.daysUntilDue} days`;
					break;
				}
				case DueState.due: {
					dueClasses.push('task__due-state--due');
					dueText = '<span class="codicon codicon-history"></span>';
					dueTitle = `Due Today`;
					break;
				}
				case DueState.overdue: {
					dueClasses.push('task__due-state--overdue');
					dueText = `<span class="codicon codicon-history"></span><span class="task__overdue-count">${this.model.due?.overdueInDays || ''}</span>`;
					dueTitle = `Overdue by ${this.model.due?.overdueInDays || '?'} days`;
					break;
				}
				case DueState.invalid: {
					dueClasses.push('task__due-state--invalid');
					dueText = '<span class="codicon codicon-error"></span><span class="task__days-to-count">Invalid</span>';
					dueTitle = 'Due date is Invalid';
					break;
				}
			}
			return `<span class="${dueClasses.join(' ')}" title="${dueTitle} \n\n ${this.model.due.raw}">${dueText}</span>`;
		}
	}
	get nestedCount() {
		if (this.model.subtasks.length !== 0 && this.model.parentTaskLineNumber === undefined) {
			const allNestedTasks = getAllNestedTasksWebview(this.model);
			return `<span class="task__nested-count-number" title="Nested tasks count">${allNestedTasks.filter(task => task.done).length}/${allNestedTasks.length}</span>`;
		} else {
			return undefined;
		}
	}

	mounted() {
		if (this.model.start && !this.model.completionDate) {
			this.durationTimerId = setInterval(() => {
				this.duration = durationTo(this.model, false, true);
			}, 1000);
		}
	}
	beforeUnmount() {
		clearInterval(this.durationTimerId);
	}
}
