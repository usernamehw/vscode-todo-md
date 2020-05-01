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

	if (property === SortProperty.priority) {
		if (direction === SortDirection.DESC) {
			return tasksCopy.sort((a, b) => (a.priority || 'Z') > (b.priority || 'Z') ? 1 : -1);
		} else {
			return tasksCopy.sort((a, b) => (a.priority || 'Z') < (b.priority || 'Z') ? 1 : -1);
		}
	}

	throw new Error('Unknown sort property');
}
