import { extensionState } from '../extension';

export function clearGlobalState() {
	(extensionState.extensionContext.globalState as any)._value = {};
	extensionState.extensionContext.globalState.update('hack', 'toClear');// Required to clear state
}
