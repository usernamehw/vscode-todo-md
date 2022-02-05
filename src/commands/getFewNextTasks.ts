import { window } from 'vscode';
import { extensionConfig, extensionState, updateState } from '../extension';
import { defaultSortTasks } from '../sort';
import { formatTask } from '../utils/taskUtils';
import { fancyNumber } from '../utils/utils';

export async function getFewNextTasks() {
	await updateState();
	const tasks = extensionState.tasks.filter(t => !t.done);
	if (!tasks.length) {
		window.showInformationMessage('No tasks');
		return;
	}
	const sortedTasks = defaultSortTasks(tasks)
		.slice(0, extensionConfig.getNextNumberOfTasks);

	window.showInformationMessage(sortedTasks.map((task, i) => `${fancyNumber(i + 1)} ${formatTask(task)}`).join('\n'), {
		modal: true,
	});
}
