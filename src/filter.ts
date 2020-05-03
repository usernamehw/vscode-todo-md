import { Task } from './parse';

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
				if (task.done) {
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
	done,
}
interface Filter {
	value: string;
	filterType: FilterType;
}

function parseFilter(filter: string) {
	const words = filter.split(' ');
	const filters: Filter[] = [];
	for (const word of words) {
		const value = word.slice(1);
		if (word[0] === '#') {
			filters.push({
				value,
				filterType: FilterType.tagEqual,
			});
		} else if (word[0] === '@') {
			filters.push({
				value,
				filterType: FilterType.contextEqual,
			});
		} else if (word[0] === '+') {
			filters.push({
				value,
				filterType: FilterType.projectEqual,
			});
		} else if (word[0] === '$') {
			if (value === 'done') {
				filters.push({
					value,
					filterType: FilterType.done,
				});
			}
		}
	}
	return filters;
}

