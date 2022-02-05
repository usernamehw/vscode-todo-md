import { TaskTreeItem } from '../treeViewProviders/taskProvider';
import { followLinks } from '../utils/vscodeUtils';

export function followLinkCommand(treeItem: TaskTreeItem) {
	followLinks(treeItem.task.links);
}
