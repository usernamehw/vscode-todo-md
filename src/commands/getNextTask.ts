import { window } from 'vscode';
import { showTaskInNotification } from '../commands';
import { $state, updateState } from '../extension';
import { nextSort } from '../sort';

export async function getNextTask() {
	await updateState();
	const tasks = $state.tasks.filter(t => !t.done);
	if (!tasks.length) {
		window.showInformationMessage('No tasks');
		return;
	}
	const sortedTasks = nextSort(tasks);
	const task = sortedTasks[0];
	showTaskInNotification(task);
}
