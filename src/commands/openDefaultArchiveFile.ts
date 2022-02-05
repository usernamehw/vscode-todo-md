import { extensionConfig } from '../extension';
import { checkArchiveFileAndNotify } from '../utils/extensionUtils';
import { openFileInEditor } from '../utils/vscodeUtils';

export async function openDefaultArchiveFile() {
	const isDefaultArchiveFileSpecified = await checkArchiveFileAndNotify();
	if (!isDefaultArchiveFileSpecified) {
		return;
	}
	openFileInEditor(extensionConfig.defaultArchiveFile);
}
