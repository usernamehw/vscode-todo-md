import { applyTreeViewFilter } from './commands/applyFilterToTreeView';
import { $state } from './extension';

interface GlobalStateMap {
	'tasksTreeViewFilterValue': string;
}

export function getGlobalState<T extends keyof GlobalStateMap>(key: T): GlobalStateMap[T] | undefined {
	return $state.extensionContext.globalState.get(key);
}

export function setGlobalSate<T extends keyof GlobalStateMap>(key: T, value: GlobalStateMap[T] | undefined): void {
	$state.extensionContext.globalState.update(key, value);
}


export function restoreGlobalState(): void {
	const treeViewFilter = getGlobalState('tasksTreeViewFilterValue');
	if (treeViewFilter) {
		applyTreeViewFilter(treeViewFilter);
	}
}
