import dayjs from 'dayjs';
import { dayOfTheWeekRegexp, dayOfWeekToIndexOfWeek, monthStringToMonthIndex } from './timeUtils';

/**
 * - Returns undefined for invalid input
 * - Returns dayjs date for valid input
 * - TODO: create recurring dates with starting date
 */
export function helpCreateDueDate(str: string, targetNow = new Date()): dayjs.Dayjs | undefined {
	if (str === '+') {
		str = '+1';// alias for tomorrow
	} else if (str === '-') {
		str = '-1';// alias for yesterday
	}
	const justDateMatch = /^(\d+)$/.exec(str);
	const dayShiftMatch = /^(\+|-)(\d+)(d|w|m)?$/.exec(str);
	const dayOfTheWeekMatch = dayOfTheWeekRegexp.exec(str);
	const monthMatch = /^(Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Aug|August|Sep|September|Oct|October|Nov|November|Dec|December)\s?(\d\d?)$/i.exec(str);
	const now = dayjs(targetNow);
	if (dayShiftMatch) {
		const sign = dayShiftMatch[1];
		const number = Number(dayShiftMatch[2]);
		const unit = dayShiftMatch[3] ?? 'd';
		const dayJSUnit = unit === 'd' ? 'day' :
			unit === 'w' ? 'week' :
				unit === 'm' ? 'month' : 'unknown';
		if (dayJSUnit === 'unknown') {
			return undefined;
		}
		let date: dayjs.Dayjs;

		if (sign === '+') {
			date = now.add(number, dayJSUnit);
		} else {
			date = now.subtract(number, dayJSUnit);
		}
		return date;
	} else if (monthMatch) {
		const month = monthMatch[1];
		const date = Number(monthMatch[2]);
		let tryDate = now.set('month', monthStringToMonthIndex(month));
		tryDate = tryDate.set('date', date);
		if (tryDate.isBefore(now, 'date')) {
			tryDate = tryDate.add(1, 'year');
		}
		return tryDate;
	} else if (justDateMatch) {
		const currentDate = now.date();
		const targetDate = Number(justDateMatch[1]);
		return targetDate >= currentDate ? now.set('date', targetDate) :
			now.add(1, 'month').set('date', targetDate);
	} else if (dayOfTheWeekMatch) {
		const targetDayIndex = dayOfWeekToIndexOfWeek(str);
		let tryDay = now.set('day', targetDayIndex);
		if (tryDay.isBefore(now, 'day')) {
			tryDay = tryDay.add(7, 'day');
		}
		return tryDay;
	} else {
		return undefined;
	}
}
