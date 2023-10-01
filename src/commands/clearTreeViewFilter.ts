import { applyTreeViewFilter } from './applyFilterToTreeView';

export function clearTreeViewFilter(): void {
	applyTreeViewFilter(undefined);
}
