import { revealTask } from '../documentActions';
import { getArchivedDocument } from '../treeViewProviders/treeViews';

export async function goToLineInArchived(lineNumber: number) {
	revealTask(lineNumber, await getArchivedDocument());
}
