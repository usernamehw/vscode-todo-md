import { $config } from '../extension';
import { checkSomedayFileAndNotify } from '../utils/extensionUtils';
import { openFileInEditor } from '../utils/vscodeUtils';

export async function openSomedayFile() {
	const isSomedayFileSpecified = await checkSomedayFileAndNotify();
	if (!isSomedayFileSpecified) {
		return;
	}
	openFileInEditor($config.defaultSomedayFile);
}
