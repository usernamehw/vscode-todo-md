import { Position, Selection, TextEditor, WorkspaceEdit } from 'vscode';
import { applyEdit } from '../utils/extensionUtils';
import { getTaskAtLineExtension } from '../utils/taskUtils';

export async function createSimilarTask(editor: TextEditor) {
	// Create a task with all the tags, projects and contexts of another task
	const selection = editor.selection;
	const task = getTaskAtLineExtension(selection.start.line);
	if (!task) {
		return;
	}
	const line = editor.document.lineAt(task.lineNumber);
	const edit = new WorkspaceEdit();

	const tagsAsString = task.tags.map(tag => ` #${tag}`).join('');
	const projectsAsString = task.projects.map(project => `+${project}`).join(' ');
	const contextsAsString = task.contexts.map(context => `@${context}`).join(' ');
	let newTaskAsString = tagsAsString;
	newTaskAsString += projectsAsString ? ` ${projectsAsString}` : '';
	newTaskAsString += contextsAsString ? ` ${contextsAsString}` : '';
	edit.insert(editor.document.uri, new Position(line.rangeIncludingLineBreak.end.line, line.rangeIncludingLineBreak.end.character), `${newTaskAsString}\n`);

	await applyEdit(edit, editor.document);

	editor.selection = new Selection(line.lineNumber + 1, 0, line.lineNumber + 1, 0);
}
