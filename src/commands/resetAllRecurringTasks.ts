import { TextEditor } from 'vscode';
import { resetAllRecurringTasks } from '../documentActions';
import { $state } from '../extension';

export function resetAllRecurringTasksCommand(editor: TextEditor) {
	const lastVisit = $state.lastVisitByFile[editor.document.uri.toString()];
	resetAllRecurringTasks(editor.document, lastVisit);
}
