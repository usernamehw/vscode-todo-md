import { expect } from 'chai';
import dayjs from 'dayjs';
import _ from 'lodash';
import { describe, it } from 'mocha';
import { DueDate } from '../../dueDate';
import { DueState } from '../../types';

function addDays(date: Date, n: number) {
	return dayjs(date).add(n, 'day').toDate();
}

const $1jan2018monday = new Date(2018, 0, 1);// just an ok date, first day of the year, month, week
const $1jan2018mondayDueDate = new DueDate('2018-01-01', $1jan2018monday);

describe('Not recurring', () => {
	it('Simple date format `2018-01-01`', () => {
		expect($1jan2018mondayDueDate.isDue === DueState.due).to.be.ok;
	});
	it('`2018-01-01` is not recurring', () => {
		expect($1jan2018mondayDueDate.isRecurring === false).to.be.ok;
	});
});

describe('♻ Recurring', () => {
	describe('`ed` (every day alias). Is due on any day', () => {
		const ed = new DueDate('ed', addDays($1jan2018monday, _.random(-100, 100)));
		expect(ed.isDue === DueState.due).to.be.ok;
	});
});
