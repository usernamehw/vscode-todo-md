import { TextEditor, TextEditorEdit } from 'vscode';
import { sortTasksInEditor } from '../commands';

export function sortByPriority(editor: TextEditor, edit: TextEditorEdit) {
	sortTasksInEditor(editor, edit, 'priority');
}
