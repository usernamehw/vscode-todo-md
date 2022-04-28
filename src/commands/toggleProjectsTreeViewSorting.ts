import { TreeItemSortType } from '../types';
import { toggleGlobalSetting } from '../utils/vscodeUtils';

export function toggleProjectsTreeViewSorting() {
	toggleGlobalSetting('todomd.sortProjectsView', [TreeItemSortType.Alphabetic, TreeItemSortType.Count]);
}
