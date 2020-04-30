/**
 * Get date part (without time) ISO 8601
 * Example: `2020-04-21`
 */
export function getTodayDateInISOFormat(): string {
	return new Date().toISOString().slice(0, 10);
}
/**
 * Get date time ISO 8601
 * Example: `2020-04-30T09:11:17`
 * TODO: maybe the time should be shifted?
 */
export function getNowDateTimeInISOFormat(): string {
	return new Date().toISOString().slice(0, 19);
}
