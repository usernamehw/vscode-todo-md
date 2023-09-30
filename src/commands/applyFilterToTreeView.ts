import { QuickPickItem, window } from 'vscode';
import { $config, $state } from '../extension';
import { FILTER_CONSTANTS } from '../filter';
import { tasksView, updateTasksTreeView } from '../treeViewProviders/treeViews';
import { VscodeContext, setContext } from '../vscodeContext';

export function applyFilterToTreeView() {
	const quickPick = window.createQuickPick();
	quickPick.items = [
		...$config.savedFilters.map(fl => ({
			label: fl.title,
		}) as QuickPickItem),
		...Object.keys(FILTER_CONSTANTS).map(savedFilterKey => ({
			label: savedFilterKey,
		}) as QuickPickItem),
	];
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
			// Saved filter
			filterStr = $config.savedFilters.find(fl => fl.title === selected)?.filter;
			// Filter Constant
			if (!filterStr) {
				// @ts-ignore
				filterStr = FILTER_CONSTANTS[selected];
			}
		} else {
			filterStr = value;
		}
		quickPick.hide();
		quickPick.dispose();
		if (!filterStr || !filterStr.length) {
			return;
		}
		tasksView.description = `Filter: ${filterStr}`;
		setContext(VscodeContext.FilterActive, true);
		$state.taskTreeViewFilterValue = filterStr;
		updateTasksTreeView();
	});
}
