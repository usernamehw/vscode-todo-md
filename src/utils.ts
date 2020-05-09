import { promises as fs } from 'fs';
import dayjs from 'dayjs';

import { DueState } from './types';
import { calcDiffInDays, shortenToDate, isTheSameDay, shiftDays } from './timeUtils';

interface DueReturn {
	isRecurring: boolean;
	isRange: boolean;
	isDue: DueState;
}
const dueWithDateRegexp = /(\d\d\d\d)-(\d\d)-(\d\d)(-(\w+))?/;
const everyNDayRegexp = /e(\d+)d/;

export function parseDue(due: string): DueReturn[] {
	const dueDates = due.split(',').filter(d => d.length);
	return dueDates.map(dueDate => parseDueDate(dueDate));
}

function parseDueDate(due: string): DueReturn {
	if (due === 'today') {
		return {
			isRecurring: false,
			isRange: false,
			isDue: DueState.due,
		};
	}
	const tryAsRange = due.split('..');
	if (tryAsRange.length > 1) {
		return isDueBetween(tryAsRange[0], tryAsRange[1]);
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
		isRange: false, // TODO: here
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

function isDueBetween(d1: string, d2: string): DueReturn {
	const now = dayjs();
	const date1 = dayjs(d1);
	const date2 = dayjs(d2);
	let isDue;
	if (date1.isBefore(now, 'day') && date2.isBefore(now, 'day')) {
		isDue = DueState.overdue;
	} else {
		isDue = dayjs().isBetween(d1, dayjs(d2), 'day', '[]') ? DueState.due : DueState.notDue;
	}
	return {
		isRecurring: false,
		isRange: true,
		isDue,
	};
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
	const match = /(?!every|each|e)\s?(\d+)?\s?(d|days?)/.exec(dueDate);
	if (match) {
		const interval = match[1] ? +match[1] : 1;
		const unit = match[2];
		if (/^(d|days?)$/.test(unit)) {
			const diffInDays = calcDiffInDays(shortenToDate(dueDateStart), shortenToDate(targetTimestamp));

			if (diffInDays % interval === 0) return DueState.due;
		} else if (/^(m|months?)$/.test(unit)) {
		}
	}

	return DueState.notDue;
}

export async function appendTaskToFile(text: string, filePath: string) {
	await fs.appendFile(filePath, `${text}\n`);
}

export function getRandomInt(min: number, max: number): number {
	return min + Math.floor(Math.random() * (max - min + 1));
}

export function prominentNumber(n: number): string {
	const digitMap = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
	return String(n).split('').map(digit => digitMap[digit]).join('');
}
