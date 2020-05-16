import { TheTask } from './parse';
import { DueState } from './types';

const enum FilterType {
	titleEqual,
	tagEqual,
	contextEqual,
	projectEqual,
	priorityEqual,
	due,
	overdue,
	recurring,
	done,
	noTag,
	noProject,
	noContext,
}
const enum FilterMoreLess {
	none,
	more,
	less,
}
interface Filter {
	value: string;
	filterType: FilterType;
	isNegation?: boolean;
	filterMoreLess?: FilterMoreLess;
}

export function filterItems(tasks: TheTask[], filterStr: string): TheTask[] {
	if (filterStr.length === 0) {
		return tasks;
	}
	const filters = parseFilter(filterStr);
	const filteredTasks = tasks.filter(task => {
		const results = [];
		for (const filter of filters) {
			let filterResult;
			if (filter.filterType === FilterType.titleEqual) {
				// Title
				if (task.title.toLowerCase().includes(filter.value.toLowerCase())) {
					filterResult = true;
				} else {
					filterResult = false;
				}
			} else if (filter.filterType === FilterType.tagEqual) {
				// #Tag
				if (task.tags.includes(filter.value)) {
					filterResult = true;
				} else {
					filterResult = false;
				}
			} else if (filter.filterType === FilterType.contextEqual) {
				// @Context
				if (task.contexts.includes(filter.value)) {
					filterResult = true;
				} else {
					filterResult = false;
				}
			} else if (filter.filterType === FilterType.projectEqual) {
				// +Project
				if (task.projects.includes(filter.value)) {
					filterResult = true;
				} else {
					filterResult = false;
				}
			} else if (filter.filterType === FilterType.priorityEqual) {
				// $A - $Z priority
				if (filter.filterMoreLess) {
					// >$A <$A
					if (filter.filterMoreLess === FilterMoreLess.more) {
						filterResult = filter.value >= task.priority;
					} else {
						filterResult = filter.value <= task.priority;
					}
				} else {
					// Simple equal
					if (task.priority === filter.value) {
						filterResult = true;
					} else {
						filterResult = false;
					}
				}
			} else if (filter.filterType === FilterType.done) {
				// $done
				if (task.done) {
					filterResult = true;
				} else {
					filterResult = false;
				}
			} else if (filter.filterType === FilterType.due) {
				// $due
				if (task.due?.isDue === DueState.due || task.due?.isDue === DueState.overdue) {
					filterResult = true;
				} else {
					filterResult = false;
				}
			} else if (filter.filterType === FilterType.overdue) {
				// $overdue
				if (task.due?.isDue === DueState.overdue) {
					filterResult = true;
				} else {
					filterResult = false;
				}
			} else if (filter.filterType === FilterType.recurring) {
				// $recurring
				if (task.due?.isRecurring === true) {
					filterResult = true;
				} else {
					filterResult = false;
				}
			} else if (filter.filterType === FilterType.noTag) {
				// $noTag
				if (task.tags.length === 0) {
					filterResult = true;
				} else {
					filterResult = false;
				}
			} else if (filter.filterType === FilterType.noProject) {
				// $noProject
				if (task.projects.length === 0) {
					filterResult = true;
				} else {
					filterResult = false;
				}
			} else if (filter.filterType === FilterType.noContext) {
				// $noContext
				if (task.contexts.length === 0) {
					filterResult = true;
				} else {
					filterResult = false;
				}
			}
			if (filter.isNegation) {
				filterResult = !filterResult;
			}
			results.push(filterResult);
		}
		return results.every(r => r === true);
	});
	return filteredTasks;
}

function parseFilter(filterStr: string) {
	const filters: Filter[] = [];
	const titleRegex = /"(.+?)"/;
	const titleMatch = titleRegex.exec(filterStr);
	if (titleMatch) {
		filters.push({
			filterType: FilterType.titleEqual,
			value: titleMatch[1],
			isNegation: false, // TODO: do
		});
		filterStr = filterStr.replace(titleRegex, '');
	}
	const words = filterStr.split(' ');
	for (const word of words) {
		if (!word.length) {
			continue;
		}
		const filter: Filter = {
			isNegation: false,
			value: '',
			filterType: FilterType.tagEqual, // TODO: default to text
		};
		let isNegation;
		let value;
		let firstChar;
		if (word[0] === '-') {
			isNegation = true;
			value = word.slice(2);
			firstChar = word[1];
		} else {
			if (word[0] === '>' || word[0] === '<') {
				firstChar = word[1];
				value = word.slice(2);
				filter.filterMoreLess = word[0] === '>' ? FilterMoreLess.more : FilterMoreLess.less;
			} else {
				value = word.slice(1);
				firstChar = word[0];
			}
		}
		switch (firstChar) {
			case '#': {
				filter.filterType = FilterType.tagEqual; break;
			}
			case '@': {
				filter.filterType = FilterType.contextEqual; break;
			}
			case '+': {
				filter.filterType = FilterType.projectEqual; break;
			}
			case '$': {
				if (value === 'done') {
					filter.filterType = FilterType.done;
				} else if (value === 'due') {
					filter.filterType = FilterType.due;
				} else if (value === 'overdue') {
					filter.filterType = FilterType.overdue;
				} else if (value === 'recurring') {
					filter.filterType = FilterType.recurring;
				} else if (value === 'noProject') {
					filter.filterType = FilterType.noProject;
				} else if (value === 'noContext') {
					filter.filterType = FilterType.noContext;
				} else if (value === 'noTag') {
					filter.filterType = FilterType.noTag;
				} else if (/^[A-Z]$/.test(value)) {
					filter.filterType = FilterType.priorityEqual;
				}
				break;
			}
			default: {
				filter.filterType = FilterType.tagEqual;
			}
		}
		filter.value = value;
		filter.isNegation = isNegation;
		filters.push(filter);
	}
	return filters;
}

