import { Task } from './parse';

export function filterItems(tasks: Task[], filter: string): Task[] {
	if (filter.length === 0) {
		return tasks;
	}
	return tasks;
}

function parseFilter(filter: string) {

}

