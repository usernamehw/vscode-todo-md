import { config } from './extension';

/**
 * Get date part (without time) ISO 8601
 * Example: `2020-04-21`
 */
export function getTodayDateInISOFormat(): string {
	let now = new Date();
	if (config.useLocalDateTime) {
		now = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
	}
	return now.toISOString().slice(0, 10);
}
/**
 * Get date time ISO 8601
 * Example: `2020-04-30T09:11:17`
 * TODO: maybe the time should be shifted?
 */
export function getNowDateTimeInISOFormat(): string {
	let now = new Date();
	if (config.useLocalDateTime) {
		now = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
	}
	return now.toISOString().slice(0, 19);
}
