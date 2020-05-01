import { Task } from './parse';
/**
 * Filter must support negation
 * Filter must support AND
 * Filter must support OR
 * Filter must support > <
 */
// @ts-ignore
export function filterItems(tasks: Task[], filter: string): Task[] {
	if (filter.length === 0) {
		return tasks;
	}
}

function parseFilter(filter: string) {

}

