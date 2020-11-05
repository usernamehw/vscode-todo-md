import escapeRegexp from 'lodash/escapeRegExp';
import marked from 'marked';
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { mapState } from 'vuex';
import { TheTask } from '../../src/TheTask';
import { DueState, IExtensionConfig } from '../../src/types';
import { toggleDoneMutation, updateFilterValueMutation, vscodeApi } from './store';

@Component({
	computed: {
		...mapState(['config', 'filterInputValue']),
	},
})
export default class Task extends Vue {
	@Prop()
	private readonly model!: TheTask;

	config!: IExtensionConfig['webview'];
	filterInputValue!: string;

	// ──────────────────────────────────────────────────────────────────────
	toggleDone() {
		toggleDoneMutation(this.model);
	}
	revealTask() {
		vscodeApi.postMessage({
			type: 'goToTask',
			value: this.model.lineNumber,
		});
	}
	updateFilterValue(newValue: string, append = false) {
		if (append) {
			updateFilterValueMutation(`${this.filterInputValue} ${newValue}`);
		} else {
			updateFilterValueMutation(newValue);
		}
	}
	toggleTaskCollapse() {
		vscodeApi.postMessage({
			type: 'toggleTaskCollapse',
			value: this.model.lineNumber,
		});
	}
	incrementCount() {
		vscodeApi.postMessage({
			type: 'incrementCount',
			value: this.model.lineNumber,
		});
	}
	decrementCount() {
		vscodeApi.postMessage({
			type: 'decrementCount',
			value: this.model.lineNumber,
		});
	}
	// ──────────────────────────────────────────────────────────────────────
	/**
	 * Task title (either markdown or text)
	 */
	get taskTitle() {
		let title = this.model.title;

		if (!this.config.markdownEnabled) {
			if (this.model.links.length) { // Remove links and append them to the end
				for (const link of this.model.links) {
					const linkEl = document.createElement('a');
					linkEl.href = link.value;
					linkEl.title = link.value;
					linkEl.text = link.value;
					title = title.replace(new RegExp(`${escapeRegexp(link.value)}?`), '');
				}
			}
		}

		if (this.model.title.trim().length !== 0) {
			if (this.config.markdownEnabled) {
				title = marked(this.model.title);
			}
		}
		return title;
	}
	/**
	 * Computed classes assigned to task-list-item element
	 */
	get classes() {
		const cls: {
			[className: string]: boolean;
		} = {};
		cls.done = this.model.done;
		if (!this.model.parentTaskLineNumber) {
			cls[`nested-lvl-${this.model.indentLvl}`] = true;
		}
		switch (this.model.priority) {
			case 'A': cls.pri1 = true; break;
			case 'B': cls.pri2 = true; break;
			case 'C': cls.pri3 = true; break;
			case 'D': cls.pri4 = true; break;
			case 'E': cls.pri5 = true; break;
			case 'F': cls.pri6 = true; break;
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
		return cls;
	}
}
