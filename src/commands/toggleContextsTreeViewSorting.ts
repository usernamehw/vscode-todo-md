import { TreeItemSortType } from '../types';
import { toggleGlobalSetting } from '../utils/vscodeUtils';

export function toggleContextsTreeViewSorting() {
	toggleGlobalSetting('todomd.sortContextsView', [TreeItemSortType.alphabetic, TreeItemSortType.count]);
}
