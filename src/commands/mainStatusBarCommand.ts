import { window } from 'vscode';
import { revealTask, toggleDoneOrIncrementCountAtLines } from '../documentActions';
import { $config } from '../extension';
import { getActiveOrDefaultDocument } from '../utils/extensionUtils';
import { getNextFewTasks } from './getFewNextTasks';
import { updateEverything } from '../events';

export async function mainStatusBarCommand() {
	if ($config.mainStatusBarItem.onClick === 'nothing') {
		return;
	}

	const nextTask = getNextFewTasks()[0];

	if (!nextTask) {
		window.showWarningMessage('Count not find any next tasks');
		return;
	}

	if ($config.mainStatusBarItem.onClick === 'revealTask') {
		revealTask(nextTask.lineNumber);
		return;
	}

	if ($config.mainStatusBarItem.onClick === 'completeTask') {
		toggleDoneOrIncrementCountAtLines(await getActiveOrDefaultDocument(), [nextTask.lineNumber]);
		await updateEverything();
		return;
	}
}
