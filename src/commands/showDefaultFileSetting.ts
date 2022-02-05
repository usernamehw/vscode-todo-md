import { Constants } from '../extension';
import { openSettingsGuiAt } from '../utils/vscodeUtils';

export function showDefaultFileSetting() {
	openSettingsGuiAt(Constants.defaultFileSetting);
}
