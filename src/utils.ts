import * as fs from 'fs';

import { DueState } from './types';
import { config } from './extension';

export const ONE_MINUTE_IN_MS = 60000;
export const ONE_HOUR_IN_MS = 3600000;
export const ONE_DAY_IN_MS = 86400000;
export const ONE_WEEK_IN_MS = 604800000;

// console.log('\u001b[' + 32 + 'm' + 'hello stack' + '\u001b[0m');

/**
 * Shift date by the amount of days (positive or negative)
 * ```
 * shiftDays(new Date(), -4)// 4 days ago
 * shiftDays(new Date(), 10)// 10 days in the future
 * ```
 */
export function shiftDays(date: Date | number, numberOfDays: number): Date {
	return new Date(+date + ONE_DAY_IN_MS * numberOfDays);
}
/**
 * Check if the date **year/month/day** is the same (ignoring time)
 */
export function isTheSameDay(d1: number | Date, d2: number | Date): boolean {
	return new Date(d1).toDateString() === new Date(d2).toDateString();
}
/**
 * Remove time from date and return new Date object
 */
export function shortenToDate(date: string | number | Date): Date {
	return new Date(new Date(date).setHours(0, 0, 0, 0));
}

export function calcDiffInDays(d1: number | Date, d2: number | Date): number {
	return Math.trunc((+d2 - +d1) / ONE_DAY_IN_MS);
}
interface DueReturn {
	isRecurring: boolean;
	isDue: DueState;
}
const dueWithDateRegexp = /(\d\d\d\d)-(\d\d)-(\d\d)(-(\w+))?/;
const everyNDayRegexp = /e(\d+)d/;

export function parseDue(due: string): DueReturn {
	if (due === 'today') {
		return {
			isRecurring: false,
			isDue: DueState.due,
		};
	}
	let isRecurring = false;
	let isDue = DueState.notDue;
	const match = dueWithDateRegexp.exec(due);
	if (match) {
		const year = Number(match[1]);
		const month = Number(match[2]) - 1;
		const date = Number(match[3]);
		const dateObject = new Date(year, month, date);
		const dueAlgorithm = match[5];
		if (!dueAlgorithm) {
			isDue = isDueExactDate(dateObject);
			isRecurring = false;
		} else {
			isRecurring = true;
			const everyNDay = everyNDayRegexp.exec(dueAlgorithm);
			if (everyNDay) {
				const interval = +everyNDay[1];
				isDue = isDueWithDate(dueAlgorithm, new Date(year, month, date));
			}
		}
	} else {
		// Due date without starting date
		isRecurring = true;
		isDue = isDueToday(due);
	}
	return {
		isDue,
		isRecurring,
	};
}

function isDueExactDate(date: Date): DueState {
	const now = new Date();
	if (now.getTime() < date.getTime()) {
		return DueState.notDue;
	}
	const diffInDays = calcDiffInDays(shortenToDate(now), shortenToDate(date));
	if (diffInDays === 0) {
		return DueState.due;
	} else {
		return DueState.overdue;
	}
}

function isDueToday(due: string): DueState {
	if (due === 'ed') {
		return DueState.due;
	}

	const day = new Date().getDay();
	if (due === 'eSun' && day === 0) {
		return DueState.due;
	} else if (due === 'eMon' && day === 1) {
		return DueState.due;
	} else if (due === 'eTue' && day === 2) {
		return DueState.due;
	} else if (due === 'eWed' && day === 3) {
		return DueState.due;
	} else if (due === 'eThu' && day === 4) {
		return DueState.due;
	} else if (due === 'eFri' && day === 5) {
		return DueState.due;
	} else if (due === 'eSat' && day === 6) {
		return DueState.due;
	}
	return DueState.notDue;
}

export function isDueWithDate(dueDate: string, dueDateStart: number | Date | undefined, date: number | Date = new Date()): DueState {
	const targetTimestamp: number = +date;
	if (dueDateStart === undefined) {
		throw new Error('dueDate was specified, but dueDateStart is missing');
	}
	if (/(^every|^each|^e)/.test(dueDate)) { // repeating
		const match = /(?!every|each|e)\s?(\d+)?\s?(d|days?|weeks?|m|months?)/.exec(dueDate);
		if (match) {
			const interval = match[1] ? +match[1] : 1;
			const unit = match[2];
			if (/^(d|days?)$/.test(unit)) {
				const diffInDays = calcDiffInDays(shortenToDate(dueDateStart), shortenToDate(targetTimestamp));

				if (diffInDays % interval === 0) return DueState.due;
			} else if (/^(m|months?)$/.test(unit)) {
			}
		}
	} else {
		if (dueDate === 'today') {
			return targetTimestamp > dueDateStart ? DueState.due : DueState.notDue;
			// return isTheSameDay(dueDateStart, targetTimestamp);
		} else if (dueDate === 'tomorrow') {
			return isTheSameDay(shiftDays(dueDateStart, 1), targetTimestamp) ? DueState.due : DueState.notDue;
		} else if (/^in\s?(\d+)\s?(d|days?|w|weeks?)$/i.test(dueDate)) {
			const match = /in\s?(\d+)\s?(d|days?|w|weeks?)/i.exec(dueDate);
			const interval: number = match ? +match[1] : 1;
			// @ts-ignore
			const unit = match[2];
			if (/^(d|days?)$/.test(unit)) {
				return isTheSameDay(shiftDays(dueDateStart, interval), targetTimestamp) ? DueState.due : DueState.notDue;
			} else if (/^(w|weeks?)$/.test(unit)) {
				return isTheSameDay(shiftDays(dueDateStart, interval * 7), targetTimestamp) ? DueState.due : DueState.notDue;
			}
		}
	}

	return DueState.notDue;
}

export function appendTaskToFile(text: string, filePath: string): void {
	fs.appendFile(filePath, `${text}\n`, err => {
		if (err) throw err;
	});
}
