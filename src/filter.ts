import { Task } from './parse';
/**
 * Filter must support negation
 * Filter must support AND
 * Filter must support OR
 * Filter must support > <
 */

export function filterItems(tasks: Task[], filter: string): Task[] {
	if (filter.length === 0) {
		return tasks;
	}
	return tasks;
}

function parseFilter(filter: string) {

}

