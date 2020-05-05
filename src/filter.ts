import { Task } from './parse';
import { DueState } from './types';

export function filterItems(tasks: Task[], filterStr: string): Task[] {
	if (filterStr.length === 0) {
		return tasks;
	}
	const filters = parseFilter(filterStr);
	const filteredTasks = tasks.filter(task => {
		const results = [];
		for (const filter of filters) {
			if (filter.filterType === FilterType.tagEqual) {
				// #Tag
				if (task.tags.includes(filter.value)) {
					results.push(true);
				} else {
					results.push(false);
				}
			} else if (filter.filterType === FilterType.contextEqual) {
				// @Context
				if (task.contexts.includes(filter.value)) {
					results.push(true);
				} else {
					results.push(false);
				}
			} else if (filter.filterType === FilterType.projectEqual) {
				// +Project
				if (task.projects.includes(filter.value)) {
					results.push(true);
				} else {
					results.push(false);
				}
			} else if (filter.filterType === FilterType.done) {
				// $done
				let filterResult;
				if (task.done) {
					filterResult = true;
				} else {
					filterResult = false;
				}
				if (filter.isNegation) {
					filterResult = !filterResult;
				}
				results.push(filterResult);
			} else if (filter.filterType === FilterType.due) {
				// $due
				if (task.isDue === DueState.due || task.isDue === DueState.overdue) {
					results.push(true);
				} else {
					results.push(false);
				}
			} else if (filter.filterType === FilterType.overdue) {
				// $overdue
				if (task.isDue === DueState.overdue) {
					results.push(true);
				} else {
					results.push(false);
				}
			}
		}
		return results.every(r => r === true);
	});
	return filteredTasks;
}
const enum FilterType {
	tagEqual,
	contextEqual,
	projectEqual,
	due,
	overdue,
	done,
}
interface Filter {
	value: string;
	filterType: FilterType;
	isNegation?: boolean;
}

function parseFilter(filter: string) {
	const words = filter.split(' ');
	const filters: Filter[] = [];
	for (const word of words) {
		let isNegation;
		let value;
		let firstChar;
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
				filters.push({
					value,
					filterType: FilterType.tagEqual,
					isNegation,
				});
				break;
			}
			case '@': {
				filters.push({
					value,
					filterType: FilterType.contextEqual,
					isNegation,
				});
				break;
			}
			case '+': {
				filters.push({
					value,
					filterType: FilterType.projectEqual,
					isNegation,
				});
				break;
			}
			case '$': {
				if (value === 'done') {
					filters.push({
						value,
						filterType: FilterType.done,
						isNegation,
					});
				} else if (value === 'due') {
					filters.push({
						value,
						filterType: FilterType.due,
						isNegation,
					});
				} else if (value === 'overdue') {
					filters.push({
						value,
						filterType: FilterType.overdue,
						isNegation,
					});
				}
				break;
			}
		}
	}
	return filters;
}

