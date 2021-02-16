import marked from 'marked';
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { mapState } from 'vuex';
import { TheTask } from '../../src/TheTask';
import { DueState, ExtensionConfig } from '../../src/types';
import { SendMessage } from './SendMessage';
import { selectTaskMutation, toggleDoneMutation, updateFilterValueMutation } from './store';
import { VueEvents } from './webviewTypes';

@Component({
	computed: {
		...mapState(['config', 'filterInputValue', 'selectedTaskLineNumber']),
	},
})
export default class Task extends Vue {
	@Prop()
	private readonly model!: TheTask;

	config!: ExtensionConfig['webview'];
	filterInputValue!: string;
	selectedTaskLineNumber!: number;

	toggleTaskCollapse = () => {
		SendMessage.toggleTaskCollapse(this.model.lineNumber);
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
	}
	toggleDone() {
		toggleDoneMutation(this.model);
	}
	revealTask() {
		SendMessage.revealTask(this.model.lineNumber);
	}
	updateFilterValue(newValue: string, append = false) {
		if (append) {
			updateFilterValueMutation(`${this.filterInputValue} ${newValue}`);
		} else {
			updateFilterValueMutation(newValue);
		}
		this.$root.$emit(VueEvents.focusFilterInput);
	}
	incrementCount() {
		SendMessage.incrementCount(this.model.lineNumber);
	}
	decrementCount() {
		SendMessage.decrementCount(this.model.lineNumber);
	}
	styleForTag(tag: string) {
		if (tag in this.config.tagStyles) {
			return this.config.tagStyles[tag];
		}
		return undefined;
	}
	// ──────────────────────────────────────────────────────────────────────
	/**
	 * Task title (either markdown or text)
	 */
	get taskTitle() {
		return this.model.title.trim().length !== 0 ? marked(this.model.title) : this.model.title;
	}
	/**
	 * Computed classes assigned to task-list-item element
	 */
	get classes() {
		const cls: {
			[className: string]: boolean;
		} = {};
		cls.done = this.model.done;
		if (this.model.parentTaskLineNumber !== undefined) {
			cls[`nested-lvl-${this.model.indentLvl}`] = true;
		}
		if (this.config.showPriority) {
			switch (this.model.priority) {
				case 'A': cls.pri1 = true; break;
				case 'B': cls.pri2 = true; break;
				case 'C': cls.pri3 = true; break;
				case 'D': cls.pri4 = true; break;
				case 'E': cls.pri5 = true; break;
				case 'F': cls.pri6 = true; break;
			}
		}
		if (this.model.due) {
			switch (this.model.due.isDue) {
				case DueState.notDue: cls.notDue = true;break;
				case DueState.due: cls.due = true;break;
				case DueState.overdue: cls.overdue = true;break;
				case DueState.invalid: cls.invalid = true;break;
			}
		}
		if (this.config.completedStrikeThrough) {
			cls['strike-through'] = true;
		}
		if (this.selectedTaskLineNumber === this.model.lineNumber) {
			cls.selected = true;
		}
		return cls;
	}
	get dueDate() {
		if (this.model.due?.isDue === undefined || this.model.done) {
			return undefined;
		} else {
			const dueClasses: string[] = ['due-state'];
			let dueText = '';
			switch (this.model.due.isDue) {
				case DueState.notDue: {
					dueClasses.push('not-due');
					dueText = '';
					break;
				}
				case DueState.due: {
					dueClasses.push('due');
					dueText = '<span class="codicon codicon-history" title="Due Today"></span>';
					break;
				}
				case DueState.overdue: {
					dueClasses.push('overdue');
					dueText = `<span class="codicon codicon-history" title="Overdue"></span> <span class="overdue-count">${this.model.due?.overdueInDays || ''}</span>`;
					break;
				}
				case DueState.invalid: {
					dueClasses.push('invalid');
					dueText = '<span class="codicon codicon-error" title="Due date is Invalid"></span>';
					break;
				}
			}
			return `<span class="${dueClasses.join(' ')}">${dueText}</span>`;
		}
	}
}
