import fs from 'fs';
import { window } from 'vscode';
import { updateEverything } from '../events';
import { updateConfig } from '../extension';

export function createFileCommand(absolutePath: string): void {
	if (!absolutePath) {
		window.showErrorMessage('Create file failed: path not provided.');
		return;
	}

	try {
		fs.writeFileSync(absolutePath, '');
		window.showInformationMessage(`Created empty file: "${absolutePath}"`);
	} catch (e) {
		window.showErrorMessage((e as Error).message);
	}

	updateConfig();
	updateEverything();
}
