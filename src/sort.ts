import dayjs from 'dayjs';
import intersection from 'lodash/intersection';
import { TheTask } from './TheTask';
import { FILTER_CONSTANTS, filterTasks, uniqueTasks } from './filter';
import { UnsupportedValueError } from './utils/utils';

// 🛑 Do not import anything from 'vscode' or 'extension' into this file

/**
 * Sorting direction (never used atm).
 */
const enum SortDirection {
	DESC,
	ASC,
}
export type SortProperty = 'completionDate' | 'context' | 'creationDate' | 'Default' | 'dueDate' | 'notDue' | 'overdue' | 'priority' | 'project' | 'tag';
/**
 * Nested tasks counted; e.g. if nested task has higher priority -
 * root task will be sorted as if it had the highest priority of its subtasks.
 */
export function sortTasks({
	tasks,
	sortProperty,
}: {
	tasks: TheTask[];
	sortProperty: SortProperty;
	direction?: SortDirection;
}): TheTask[] {
	const sortedTasks = doSortTasks({
		tasks,
		sortProperty,
	});

	return uniqueTasks(sortedTasks);
}

function doSortTasks({ tasks, sortProperty }: Parameters<typeof sortTasks>[0]): TheTask[] {
	const tasksCopy = tasks.slice();

	if (sortProperty === 'Default') {
		return defaultSortTasks(tasksCopy);
	}

	if (sortProperty === 'project') {
		return sortBySimilarityOfArrays(tasksCopy, 'project');
	} else if (sortProperty === 'tag') {
		return sortBySimilarityOfArrays(tasksCopy, 'tag');
	} else if (sortProperty === 'context') {
		return sortBySimilarityOfArrays(tasksCopy, 'context');
	}

	if (sortProperty === 'priority') {
		return tasksCopy.sort((a, b) => {
			const aTasks = [
				a,
				...getSubtasksRecursive(a.subtasks),
			];
			const bTasks = [
				b,
				...getSubtasksRecursive(b.subtasks),
			];
			const highestPriorityATask = aTasks.sort(innerSortByPriority)[0];
			const highestPriorityBTask = bTasks.sort(innerSortByPriority)[0];
			return innerSortByPriority(highestPriorityATask, highestPriorityBTask);
		});
	} else if (sortProperty === 'creationDate') {
		return tasksCopy.sort((a, b) => {
			const aTasks = [
				a,
				...getSubtasksRecursive(a.subtasks),
			];
			const bTasks = [
				b,
				...getSubtasksRecursive(b.subtasks),
			];
			const closestCreationDateATask = aTasks.sort(innerSortByCreationDate)[0];
			const closestCreationDateBTask = bTasks.sort(innerSortByCreationDate)[0];
			return innerSortByCreationDate(closestCreationDateATask, closestCreationDateBTask);
		});
	} else if (sortProperty === 'completionDate') {
		return tasksCopy.sort((a, b) => {
			const aTasks = [
				a,
				...getSubtasksRecursive(a.subtasks),
			];
			const bTasks = [
				b,
				...getSubtasksRecursive(b.subtasks),
			];
			const closestCompletionDateATask = aTasks.sort(innerSortByCompletionDate)[0];
			const closestCompletionDateBTask = bTasks.sort(innerSortByCompletionDate)[0];
			return innerSortByCompletionDate(closestCompletionDateATask, closestCompletionDateBTask);
		});
	} else if (sortProperty === 'dueDate') {
		return sortByDueDate(tasksCopy);
	} else if (sortProperty === 'overdue') {
		return tasksCopy.sort((a, b) => {
			const aTasks = [
				a,
				...getSubtasksRecursive(a.subtasks),
			];
			const bTasks = [
				b,
				...getSubtasksRecursive(b.subtasks),
			];
			const highestOverdueATask = aTasks.sort(innerSortByOverdue)[0];
			const highestOverdueBTask = bTasks.sort(innerSortByOverdue)[0];
			return innerSortByOverdue(highestOverdueATask, highestOverdueBTask);
		});
	} else if (sortProperty === 'notDue') {
		return tasksCopy.sort((a, b) => {
			const aTasks = [
				a,
				...getSubtasksRecursive(a.subtasks),
			];
			const bTasks = [
				b,
				...getSubtasksRecursive(b.subtasks),
			];
			const highestUntilDueATask = aTasks.sort(innerSortByNotDue)[0];
			const highestUntilDueBTask = bTasks.sort(innerSortByNotDue)[0];
			return innerSortByNotDue(highestUntilDueATask, highestUntilDueBTask);
		});
	}

	throw new UnsupportedValueError(sortProperty);
}
function innerSortByPriority(a: TheTask, b: TheTask): number {
	if (a.priority === b.priority) {
		return 0;
	} else {
		return a.priority > b.priority ? 1 : -1;
	}
}
function innerSortByCompletionDate(a: TheTask, b: TheTask): number {
	if (a.completionDate === b.completionDate) {
		// Empty completion date `{cm}`
		if (a.done && !a.completionDate) {
			return 1;
		} else if (b.done && !b.completionDate) {
			return -1;
		}
		return 0;
	} else {
		if (a.completionDate === undefined) {
			return -Infinity;
		} else if (b.completionDate === undefined) {
			return Infinity;
		}
		return dayjs(a.completionDate).diff(b.completionDate);
	}
}
function innerSortByCreationDate(a: TheTask, b: TheTask): number {
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
}
function innerSortByOverdue(a: TheTask, b: TheTask): number {
	let overdueA = 0;
	let overdueB = 0;
	if (!a.done) {
		overdueA = a.due?.overdueInDays || 0;
	}
	if (!b.done) {
		overdueB = b.due?.overdueInDays || 0;
	}

	if (overdueA === overdueB) {
		return 0;
	} else {
		return overdueA < overdueB ? 1 : -1;
	}
}
function innerSortByNotDue(a: TheTask, b: TheTask): number {
	const untilA = a.due?.daysUntilDue || 0;
	const untilB = b.due?.daysUntilDue || 0;
	if (untilA === untilB) {
		return 0;
	} else {
		return untilA > untilB ? 1 : -1;
	}
}
/**
 * Sort tasks by groups in this order:
 * - Invalid
 * - Overdue
 * - Due
 * - Has due, but not due
 * - No due specified
 */
export function sortByDueDate(tasks: TheTask[], mixHasDueNotDueAndDoesntHaveADue = false): TheTask[] {
	const invalidDue = filterTasks(tasks, FILTER_CONSTANTS.InvalidDue).tasks;
	const overdueTasks = filterTasks(tasks, FILTER_CONSTANTS.Overdue).tasks;
	const dueTasks = filterTasks(tasks, `${FILTER_CONSTANTS.Due} -${FILTER_CONSTANTS.Overdue}`).tasks;
	const dueSpecifiedButNotDue = filterTasks(tasks, `${FILTER_CONSTANTS.HasDue} -${FILTER_CONSTANTS.Due}`).tasks;
	const dueNotSpecified = filterTasks(tasks, FILTER_CONSTANTS.NoDue).tasks;

	let sortedLast = [
		...sortTasks({
			tasks: dueSpecifiedButNotDue,
			sortProperty: 'notDue',
		}),
		...dueNotSpecified,
	];

	if (mixHasDueNotDueAndDoesntHaveADue) {
		sortedLast = sortTasks({
			tasks: sortedLast,
			sortProperty: 'priority',
		});
	}

	return uniqueTasks([
		...invalidDue,
		...sortTasks({
			tasks: overdueTasks,
			sortProperty: 'overdue',
		}),
		...dueTasks,
		...sortedLast,
	]);
}

/**
 * Favorite tasks grouped and above everything else.
 *
 * Groups are in this order:
 * - Invalid
 * - Overdue
 * - Due
 * - Has due, but not due
 * - No due specified
 *
 * With secondary sort by priority.
 */
export function defaultSortTasks(tasks: TheTask[]): TheTask[] {
	const favoriteTasks = filterTasks(tasks, FILTER_CONSTANTS.Favorite).tasks;
	const notFavoriteTasks = filterTasks(tasks, `-${FILTER_CONSTANTS.Favorite}`).tasks;

	return uniqueTasks([
		...sortByDueDate(sortTasks({
			tasks: favoriteTasks,
			sortProperty: 'priority',
		})),
		...sortByDueDate(sortTasks({
			tasks: notFavoriteTasks,
			sortProperty: 'priority',
		})),
	]);
}
/**
 * Sort tasks for commands such as `todomd.getNextTask`,
 * `todomd.getFewNextTasks`, `todomd.completeTask` to get
 * the highest priority/most due tasks first.
 */
export function nextSort(tasks: TheTask[]): TheTask[] {
	const favoriteTasks = filterTasks(tasks, FILTER_CONSTANTS.Favorite).tasks;
	const notFavoriteTasks = filterTasks(tasks, `-${FILTER_CONSTANTS.Favorite}`).tasks;

	return [
		...sortByDueDate(
			sortTasks({
				tasks: favoriteTasks,
				sortProperty: 'priority',
			}),
			true,
		),
		...sortByDueDate(
			sortTasks({
				tasks: notFavoriteTasks,
				sortProperty: 'priority',
			}),
			true,
		),
	];
}

function sortBySimilarityOfArrays(tasks: TheTask[], property: 'context' | 'project' | 'tag'): TheTask[] {
	const similarityMap: {
		ln1: number;
		ln2: number;
		similarity: number;
	}[] = [];

	for (const task1 of tasks) {
		const ln1 = task1.lineNumber;
		for (const task2 of tasks) {
			const ln2 = task2.lineNumber;
			let similarity = 0;
			if (property === 'project') {
				similarity = intersection(task1.projects, task2.projects).length;
			} else if (property === 'tag') {
				similarity = intersection(task1.tags, task2.tags).length;
			} else if (property === 'context') {
				similarity = intersection(task1.contexts, task2.contexts).length;
			}
			similarityMap.push({
				ln1,
				ln2,
				similarity,
			});
		}
	}
	similarityMap.sort((a, b) => a.similarity - b.similarity);

	const result = [];
	for (const sim of similarityMap) {
		result.push(sim.ln2, sim.ln1);
	}

	// keep unique line numbers but from the end of the array
	return [...new Set(result.reverse())]
		.reverse()
		.map(lineNumber => tasks.find(task => task.lineNumber === lineNumber)!);
}
/**
 * Return all nested tasks.
 */
function getSubtasksRecursive(tasks: TheTask[]): TheTask[] {
	const nestedTasks = [];
	for (const task of tasks) {
		nestedTasks.push(task);
		if (task.subtasks.length) {
			nestedTasks.push(...getSubtasksRecursive(task.subtasks));
		}
	}
	return nestedTasks;
}

