import { TextEditor, TextEditorEdit } from 'vscode';
import { sortTasksInEditor } from '../commands';


export function sortByCreationDate(editor: TextEditor, edit: TextEditorEdit) {
	sortTasksInEditor(editor, edit, 'creationDate');
}
