import { sample } from 'lodash';
import { window } from 'vscode';
import { showTaskInNotification } from '../commands';
import { extensionState, updateState } from '../extension';

export async function getRandomTask() {
	await updateState();
	const tasks = extensionState.tasks.filter(t => !t.done);
	if (!tasks.length) {
		window.showInformationMessage('No tasks');
		return;
	}
	const randomTask = sample(tasks)!;
	showTaskInNotification(randomTask);
}
