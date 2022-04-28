import dayjs from 'dayjs';
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
	Priority,
	NotDue,
	Overdue,
	CreationDate,
}
/**
 * Does not modify the original array.
 */
export function sortTasks(tasks: TheTask[], property: SortProperty, direction = SortDirection.DESC): TheTask[] {
	const tasksCopy = tasks.slice();
	let sortedTasks: TheTask[] = [];

	if (property === SortProperty.Priority) {
		sortedTasks = tasksCopy.sort((a, b) => {
			if (a.priority === b.priority) {
				return 0;
			} else {
				return a.priority > b.priority ? 1 : -1;
			}
		});
	} else if (property === SortProperty.CreationDate) {
		sortedTasks = tasksCopy.sort((a, b) => {
			if (a.creationDate === b.creationDate) {
				return 0;
			} else {
				if (a.creationDate === undefined) {
					return -Infinity;
				} else if (b.creationDate === undefined) {
					return Infinity;
				}
				return dayjs(a.creationDate).diff(b.creationDate);
			}
		});
	} else if (property === SortProperty.Overdue) {
		sortedTasks = tasksCopy.sort((a, b) => {
			const overdueA = a.due?.overdueInDays || 0;
			const overdueB = b.due?.overdueInDays || 0;
			if (overdueA === overdueB) {
				return 0;
			} else {
				return overdueA < overdueB ? 1 : -1;
			}
		});
	} else if (property === SortProperty.NotDue) {
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
 * Sort tasks by groups in this order: Invalid => Overdue => Due => Has due, but not due => No due specified;
 *
 * With secondary sort by priority.
 */
export function defaultSortTasks(tasks: TheTask[]) {
	tasks = sortTasks(tasks, SortProperty.Priority);

	const overdueTasks = tasks.filter(t => t.due?.isDue === DueState.Overdue);
	const dueTasks = tasks.filter(t => t.due?.isDue === DueState.Due);
	const invalidDue = tasks.filter(t => t.due?.isDue === DueState.Invalid);
	const dueSpecifiedButNotDue = tasks.filter(t => t.due?.isDue === DueState.NotDue);
	const dueNotSpecified = tasks.filter(t => !t.due);

	return [
		...invalidDue,
		...sortTasks(overdueTasks, SortProperty.Overdue),
		...dueTasks,
		...dueNotSpecified,
		...sortTasks(dueSpecifiedButNotDue, SortProperty.NotDue),
	];
}
