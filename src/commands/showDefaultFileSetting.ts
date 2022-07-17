import { Constants } from '../constants';
import { openSettingsGuiAt } from '../utils/vscodeUtils';

export function showDefaultFileSetting() {
	openSettingsGuiAt(Constants.DefaultFileSetting);
}
