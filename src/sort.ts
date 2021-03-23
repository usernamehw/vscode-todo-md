import { TheTask } from './TheTask';
import { DueState } from './types';
/**
 * Sorting direction
 */
const enum SortDirection {
	DESC,
	ASC,
}
/**
 * Sorting property
 */
export const enum SortProperty {
	priority,
	notDue,
	overdue,
}
/**
 * Does not modify the original array.
 *
 * TODO: add secondary sorting property to this function?
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
	} else if (property === SortProperty.overdue) {
		sortedTasks = tasksCopy.sort((a, b) => {
			const overdueA = a.due?.overdueInDays || 0;
			const overdueB = b.due?.overdueInDays || 0;
			if (overdueA === overdueB) {
				return 0;
			} else {
				return overdueA < overdueB ? 1 : -1;
			}
		});
	} else if (property === SortProperty.notDue) {
		sortedTasks = tasksCopy.sort((a, b) => {
			const untilA = a.due?.daysUntilDue || 0;
			const untilB = b.due?.daysUntilDue || 0;
			if (untilA === untilB) {
				return 0;
			} else {
				return untilA > untilB ? 1 : -1;
			}
		});
	}

	if (direction === SortDirection.ASC) {
		return sortedTasks.reverse();
	}

	return sortedTasks;
}

/**
 * Sort tasks by groups in this order: Overdue => Due => Not due;
 *
 * With secondary sort by priority.
 */
export function defaultSortTasks(tasks: TheTask[]) {
	const overdueTasks = tasks.filter(t => t.due?.isDue === DueState.overdue);
	const dueTasks = tasks.filter(t => t.due?.isDue === DueState.due);
	const invalidDue = tasks.filter(t => t.due?.isDue === DueState.invalid);
	const dueSpecifiedButNotDue = tasks.filter(t => t.due?.isDue === DueState.notDue);
	const dueNotSpecified = tasks.filter(t => !t.due);

	return [
		...invalidDue,
		...sortTasks(overdueTasks, SortProperty.overdue),
		...sortTasks(dueTasks, SortProperty.priority),
		...sortTasks(dueSpecifiedButNotDue, SortProperty.notDue),
		...sortTasks(dueNotSpecified, SortProperty.priority),
	];
}
