import { QuickPickItem, window } from 'vscode';
import { $config, $state } from '../extension';
import { FILTER_CONSTANTS } from '../filter';
import { tasksView, updateTasksTreeView } from '../treeViewProviders/treeViews';
import { VscodeContext, setContext } from '../vscodeContext';
import { setGlobalSate } from '../vscodeGlobalState';

export function applyFilterToTreeViewCommand() {
	const quickPick = window.createQuickPick();
	quickPick.items = [
		...$config.savedFilters.map(savedFilter => ({
			label: savedFilter.title,
		}) as QuickPickItem),
		...Object.keys(FILTER_CONSTANTS).map(savedFilterKey => ({
			label: savedFilterKey,
			detail: FILTER_CONSTANTS[savedFilterKey as keyof typeof FILTER_CONSTANTS],
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
		applyTreeViewFilter(filterStr);
	});
}

export function applyTreeViewFilter(filterStr: string | undefined): void {
	if (filterStr) {
		tasksView.description = `Filter: ${filterStr}`;
	} else {
		tasksView.description = undefined;
	}
	setContext(VscodeContext.FilterActive, Boolean(filterStr));
	$state.taskTreeViewFilterValue = filterStr;
	setGlobalSate('tasksTreeViewFilterValue', filterStr);
	updateTasksTreeView();
}
