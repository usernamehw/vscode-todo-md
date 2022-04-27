import { $state } from '../extension';

export function clearGlobalState() {
	($state.extensionContext.globalState as any)._value = {};
	$state.extensionContext.globalState.update('hack', 'toClear');// Required to clear state
}
