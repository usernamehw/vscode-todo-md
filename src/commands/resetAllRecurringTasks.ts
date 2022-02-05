import { TextEditor } from 'vscode';
import { resetAllRecurringTasks } from '../documentActions';
import { extensionState } from '../extension';

export function resetAllRecurringTasksCommand(editor: TextEditor) {
	const lastVisit = extensionState.lastVisitByFile[editor.document.uri.toString()];
	resetAllRecurringTasks(editor.document, lastVisit);
}
