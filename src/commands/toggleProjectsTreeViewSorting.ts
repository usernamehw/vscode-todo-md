import { TreeItemSortType } from '../types';
import { toggleGlobalSetting } from '../utils/vscodeUtils';

export function toggleProjectsTreeViewSorting() {
	toggleGlobalSetting('todomd.sortProjectsView', [TreeItemSortType.alphabetic, TreeItemSortType.count]);
}
