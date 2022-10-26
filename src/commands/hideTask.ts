import { toggleHiddenAtLine } from '../documentActions';
import { updateState } from '../extension';
import { TaskTreeItem } from '../treeViewProviders/taskProvider';
import { updateAllTreeViews } from '../treeViewProviders/treeViews';
import { getActiveOrDefaultDocument } from '../utils/extensionUtils';

export async function hideTask(treeItem?: TaskTreeItem) {
	if (!treeItem) {
		return;
	}
	const lineNumber = treeItem.task.lineNumber;
	const document = await getActiveOrDefaultDocument();

	toggleHiddenAtLine(document, lineNumber);

	await updateState();
	updateAllTreeViews();
}
