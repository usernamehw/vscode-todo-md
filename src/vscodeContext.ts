import { commands } from 'vscode';
import { $config } from './extension';


/**
 * This extensions' context names.
 */
export const enum VscodeContext {
	IsActive = 'todomd:isActive',
	IsDev = 'todomd:isDev',
	FilterActive = 'todomd:filterActive',
	Generic1FilterExists = 'todomd:generic1FilterExists',
	Generic2FilterExists = 'todomd:generic2FilterExists',
	Generic3FilterExists = 'todomd:generic3FilterExists',
	ArchivedFileNotSpecified = 'todomd:archivedFileNotSpecified',
}

/**
 * Set vscode context. Used in Welcome views, Menus, Keybindings...
 *
 * https://code.visualstudio.com/api/references/when-clause-contexts
 */
export async function setContext(context: VscodeContext, value: boolean) {
	return await commands.executeCommand('setContext', context, value);
}

/**
 * Update context to show menus only when developing extension.
 */
export async function updateIsDevContext(): Promise<void> {
	if (process.env.NODE_ENV === 'development' || $config.isDev) {
		await setContext(VscodeContext.IsDev, true);
	}
}
/**
 * Update context that affects welcome view for Archived Tree View.
 */
export async function updateArchivedFilePathNotSetContext(): Promise<void> {
	await setContext(VscodeContext.ArchivedFileNotSpecified, !$config.defaultArchiveFile);
}
