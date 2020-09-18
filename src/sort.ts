import { TheTask } from 'src/TheTask';

const enum SortDirection {
	DESC,
	ASC
}
export const enum SortProperty {
	priority,
}
/**
 * Does not modify the original array
 */
export function sortTasks(tasks: TheTask[], property: SortProperty, direction = SortDirection.DESC): TheTask[] {
	const tasksCopy = tasks.slice();
	let sortedTasks: TheTask[] = [];

	if (property === SortProperty.priority) {
		sortedTasks = tasksCopy.sort((a, b) => {
			if (a.priority === b.priority) {
				return 0;
			} else {
				return a.priority > b.priority ? 1 : -1;
			}
		});
	}
	if (direction === SortDirection.ASC) {
		return sortedTasks.reverse();
	}
	return sortedTasks;
}
