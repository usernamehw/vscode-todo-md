import dayjs from 'dayjs';
import { Constants, extensionState } from '../extension';
import { openInUntitled } from '../utils/vscodeUtils';

export function showGlobalState() {
	const lastVisitByFile = extensionState.extensionContext.globalState.get(Constants.LAST_VISIT_BY_FILE_STORAGE_KEY) as typeof extensionState['lastVisitByFile'];
	let str = '';
	for (const key in lastVisitByFile) {
		str += `${new Date(lastVisitByFile[key])} | ${dayjs().to(lastVisitByFile[key])} | ${key}\n` ;
	}
	openInUntitled(str);
}
