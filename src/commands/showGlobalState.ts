import dayjs from 'dayjs';
import { Constants } from '../constants';
import { $state } from '../extension';
import { openInUntitled } from '../utils/vscodeUtils';

export function showGlobalState() {
	const lastVisitByFile = $state.extensionContext.globalState.get(Constants.LastVisitByFileStorageKey) as typeof $state['lastVisitByFile'];
	let str = '';
	for (const key in lastVisitByFile) {
		str += `${new Date(lastVisitByFile[key])} | ${dayjs().to(lastVisitByFile[key])} | ${key}\n` ;
	}
	openInUntitled(str);
}
