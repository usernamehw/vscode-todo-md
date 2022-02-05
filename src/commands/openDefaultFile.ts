import { extensionConfig } from '../extension';
import { checkDefaultFileAndNotify } from '../utils/extensionUtils';
import { openFileInEditor } from '../utils/vscodeUtils';

export async function openDefaultFile() {
	const isDefaultFileSpecified = await checkDefaultFileAndNotify();
	if (!isDefaultFileSpecified) {
		return;
	}
	openFileInEditor(extensionConfig.defaultFile);
}
