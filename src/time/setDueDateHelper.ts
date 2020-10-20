import dayjs from 'dayjs';
import { dayOfTheWeekRegexp, dayOfWeekToIndexOfWeek } from './timeUtils';

/**
 * - Returns undefined for invalid input
 * - Returns dayjs date for valid input
 * TODO: create recurring dates with starting date
 */
export function helpCreateDueDate(str: string, targetNow = new Date()): dayjs.Dayjs | undefined {
	if (str === '+') {
		str = '+1';// alias for tomorrow
	} else if (str === '-') {
		str = '-1';
	}
	const justDateMatch = /^(\d+)$/.exec(str);
	const dayShiftMatch = /^(\+|-)(\d+)(d|w)?$/.exec(str);
	const dayOfTheWeekMatch = dayOfTheWeekRegexp.exec(str);
	const now = dayjs(targetNow);
	if (dayShiftMatch) {
		const sign = dayShiftMatch[1];
		const number = Number(dayShiftMatch[2]);
		const unit = dayShiftMatch[3] ?? 'd';
		let date: dayjs.Dayjs;
		if (sign === '+') {
			if (unit === 'd') {
				date = now.add(number, 'day');
			} else if (unit === 'w') {
				date = now.add(number, 'week');
			} else {
				throw Error('Should never happen');
			}
		} else {
			if (unit === 'd') {
				date = now.subtract(number, 'day');
			} else if (unit === 'w') {
				date = now.subtract(number, 'week');
			} else {
				throw Error('Should never happen');
			}
		}
		return date;
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
