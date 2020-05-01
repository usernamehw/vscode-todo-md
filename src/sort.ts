import { Task } from './parse';

const enum SortDirection {
	DESC,
	ASC
}
export const enum SortProperty {
	priority,
}

export function sortTasks(tasks: Task[], property: SortProperty, direction = SortDirection.DESC): Task[] {
	const tasksCopy = tasks.slice();
	let sortedTasks: Task[] = [];

	if (property === SortProperty.priority) {
		sortedTasks = tasksCopy.sort((a, b) => (a.priority || 'Z') > (b.priority || 'Z') ? 1 : -1);
	}
	if (direction === SortDirection.ASC) {
		return sortedTasks.reverse();
	}
	return sortedTasks;
}
