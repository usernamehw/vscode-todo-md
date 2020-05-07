import { TheTask } from './parse';
import { DueState } from './types';

const enum FilterType {
	rawEqual,
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
interface Filter {
	value: string;
	filterType: FilterType;
	isNegation?: boolean;
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
			if (filter.filterType === FilterType.rawEqual) {
				// Title
				if (task.raw.toLowerCase().includes(filter.value.toLowerCase())) {
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
				// $A - $Z
				if (task.priority === filter.value) {
					filterResult = true;
				} else {
					filterResult = false;
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
				if (task.isDue === DueState.due || task.isDue === DueState.overdue) {
					filterResult = true;
				} else {
					filterResult = false;
				}
			} else if (filter.filterType === FilterType.overdue) {
				// $overdue
				if (task.isDue === DueState.overdue) {
					filterResult = true;
				} else {
					filterResult = false;
				}
			} else if (filter.filterType === FilterType.recurring) {
				// $recurring
				if (task.isRecurring === true) {
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
	const rawRegex = /"(.+?)"/;
	const rawMatch = rawRegex.exec(filterStr);
	if (rawMatch) {
		filters.push({
			filterType: FilterType.rawEqual,
			value: rawMatch[1],
			isNegation: false, // TODO: do
		});
		filterStr = filterStr.replace(rawRegex, '');
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
		let filterType;
		if (word[0] === '-') {
			isNegation = true;
			value = word.slice(2);
			firstChar = word[1];
		} else {
			value = word.slice(1);
			firstChar = word[0];
		}
		switch (firstChar) {
			case '#': {
				filterType = FilterType.tagEqual; break;
			}
			case '@': {
				filterType = FilterType.contextEqual; break;
			}
			case '+': {
				filterType = FilterType.projectEqual; break;
			}
			case '$': {
				if (value === 'done') {
					filterType = FilterType.done;
				} else if (value === 'due') {
					filterType = FilterType.due;
				} else if (value === 'overdue') {
					filterType = FilterType.overdue;
				} else if (value === 'recurring') {
					filterType = FilterType.recurring;
				} else if (value === 'noProject') {
					filterType = FilterType.noProject;
				} else if (value === 'noContext') {
					filterType = FilterType.noContext;
				} else if (value === 'noTag') {
					filterType = FilterType.noTag;
				} else if (/^[A-Z]$/.test(value)) {
					filterType = FilterType.priorityEqual;
				}
				break;
			}
			default: {
				filterType = FilterType.tagEqual;
			}
		}
		filter.value = value;
		filter.isNegation = isNegation;
		// @ts-ignore
		filter.filterType = filterType;
		filters.push(filter);
	}
	return filters;
}

