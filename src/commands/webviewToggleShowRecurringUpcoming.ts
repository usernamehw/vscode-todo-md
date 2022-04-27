import { $config } from '../extension';
import { updateSetting } from '../utils/vscodeUtils';

export function webviewToggleShowRecurringUpcoming() {
	updateSetting('todomd.webview.showRecurringUpcoming', !$config.webview.showRecurringUpcoming);
}
