import { TextEditor } from 'vscode';
import { extensionState } from '../extension';
import { tasksView, updateTasksTreeView } from '../treeViewProviders/treeViews';
import { VscodeContext } from '../types';
import { setContext } from '../utils/vscodeUtils';

export function clearFilter() {
	tasksView.description = undefined;
	setContext(VscodeContext.filterActive, false);
	extensionState.taskTreeViewFilterValue = '';
	updateTasksTreeView();
}
