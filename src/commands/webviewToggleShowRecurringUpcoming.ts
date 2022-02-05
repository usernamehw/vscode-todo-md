import { extensionConfig } from '../extension';
import { updateSetting } from '../utils/vscodeUtils';

export function webviewToggleShowRecurringUpcoming() {
	updateSetting('todomd.webview.showRecurringUpcoming', !extensionConfig.webview.showRecurringUpcoming);
}
