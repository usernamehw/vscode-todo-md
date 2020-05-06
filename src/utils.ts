import * as fs from 'fs';

import { DueState } from './types';
import { calcDiffInDays, shortenToDate, isTheSameDay, shiftDays } from './timeUtils';

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
	if (due === 'Sun' && day === 0) {
		return DueState.due;
	} else if (due === 'Mon' && day === 1) {
		return DueState.due;
	} else if (due === 'Tue' && day === 2) {
		return DueState.due;
	} else if (due === 'Wed' && day === 3) {
		return DueState.due;
	} else if (due === 'Thu' && day === 4) {
		return DueState.due;
	} else if (due === 'Fri' && day === 5) {
		return DueState.due;
	} else if (due === 'Sat' && day === 6) {
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

export function getRandomInt(min: number, max: number): number {
	return min + Math.floor(Math.random() * (max - min + 1));
}
