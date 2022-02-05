import { WorkspaceEdit } from 'vscode';
import { toggleTaskCollapseWorkspaceEdit } from '../documentActions';
import { updateEverything } from '../events';
import { TheTask } from '../TheTask';
import { applyEdit, getActiveOrDefaultDocument } from '../utils/extensionUtils';
import { forEachTask } from '../utils/taskUtils';

export async function collapseAllNestedTasks() {
	const edit = new WorkspaceEdit();
	const activeDocument = await getActiveOrDefaultDocument();
	forEachTask(task => {
		if (TheTask.hasNestedTasks(task) && !task.isCollapsed) {
			toggleTaskCollapseWorkspaceEdit(edit, activeDocument, task.lineNumber);
		}
	});
	await applyEdit(edit, activeDocument);
	updateEverything();
}
