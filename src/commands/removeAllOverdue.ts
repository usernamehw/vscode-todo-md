import { WorkspaceEdit } from 'vscode';
import { removeOverdueWorkspaceEdit } from '../documentActions';
import { applyEdit, getActiveOrDefaultDocument } from '../utils/extensionUtils';
import { forEachTask } from '../utils/taskUtils';

export async function removeAllOverdue() {
	const activeDocument = await getActiveOrDefaultDocument();
	if (!activeDocument) {
		return;
	}
	const edit = new WorkspaceEdit();
	forEachTask(task => {
		if (task.overdueRange) {
			removeOverdueWorkspaceEdit(edit, activeDocument.uri, task);
		}
	});
	applyEdit(edit, activeDocument);
}
