import { $state } from '../extension';
import { tasksView, updateTasksTreeView } from '../treeViewProviders/treeViews';
import { VscodeContext, setContext } from '../vscodeContext';

export function clearTreeViewFilter() {
	tasksView.description = undefined;
	setContext(VscodeContext.FilterActive, false);
	$state.taskTreeViewFilterValue = '';
	updateTasksTreeView();
}
