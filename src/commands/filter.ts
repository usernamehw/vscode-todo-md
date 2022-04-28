import { QuickPickItem, TextEditor, window } from 'vscode';
import { $config, $state } from '../extension';
import { tasksView, updateTasksTreeView } from '../treeViewProviders/treeViews';
import { VscodeContext } from '../types';
import { setContext } from '../utils/vscodeUtils';

// TODO: rename
export function filter(editor: TextEditor) {
	const quickPick = window.createQuickPick();
	quickPick.items = $config.savedFilters.map(fl => ({
		label: fl.title,
	}) as QuickPickItem);
	let value: string | undefined;
	let selected: string | undefined;
	quickPick.onDidChangeValue(e => {
		value = e;
	});
	quickPick.onDidChangeSelection(e => {
		selected = e[0].label;
	});
	quickPick.show();
	quickPick.onDidAccept(() => {
		let filterStr;
		if (selected) {
			filterStr = $config.savedFilters.find(fl => fl.title === selected)?.filter;
		} else {
			filterStr = value;
		}
		quickPick.hide();
		quickPick.dispose();
		if (!filterStr || !filterStr.length) {
			return;
		}
		tasksView.description = filterStr;
		setContext(VscodeContext.FilterActive, true);
		$state.taskTreeViewFilterValue = filterStr;
		updateTasksTreeView();
	});
}
