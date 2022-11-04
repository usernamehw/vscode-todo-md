import { assert } from 'chai';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import isBetween from 'dayjs/plugin/isBetween';
import isoWeek from 'dayjs/plugin/isoWeek';
import relativeTime from 'dayjs/plugin/relativeTime';
import _ from 'lodash';
import { describe, it } from 'mocha';
import { DueDate } from '../../dueDate';
import { IsDue } from '../../types';
import { headerDelimiter } from './testUtils';

dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.extend(isoWeek);
dayjs.extend(duration);
dayjs.Ls.en.weekStart = 1;

function addDays(date: Date, n: number) {
	return dayjs(date).add(n, 'day').toDate();
}

const $1jan2018monday = new Date(2018, 0, 1);// just an ok date, first day of the year, month, week
const $2jan2018tuesday = new Date(2018, 0, 2);
const $3jan2018wednesday = new Date(2018, 0, 3);
const $4jan2018thursday = new Date(2018, 0, 4);
const $5jan2018friday = new Date(2018, 0, 5);
const $6jan2018saturday = new Date(2018, 0, 6);
const $7jan2018sunday = new Date(2018, 0, 7);

const $1jan2018mondayDueDate = new DueDate('2018-01-01', {
	targetDate: $1jan2018monday,
});

describe(`${headerDelimiter('due date')}Not recurring`, () => {
	it('Simple date format `2018-01-01` is due at that date.', () => {
		assert.equal($1jan2018mondayDueDate.isDue, IsDue.Due);
	});
	it('`2018-01-01` is not recurring', () => {
		assert.isFalse($1jan2018mondayDueDate.isRecurring);
	});
});

describe('♻ Recurring', () => {
	it('`ed` (every day alias). Is due on any day', () => {
		const ed = new DueDate('ed', {
			targetDate: addDays($1jan2018monday, _.random(-100, 100)),
		});
		assert.equal(ed.isDue, IsDue.Due);
	});
	it('`monday` is recurring', () => {
		assert.isTrue(new DueDate('monday').isRecurring);
	});
	it('Week days like `Monday` are case insensitive', () => {
		const mondayDueDate = new DueDate('Monday');
		assert.notEqual(mondayDueDate.isDue, IsDue.Invalid);
		assert.isTrue(mondayDueDate.isRecurring);
	});
	it('monday', () => {
		assert.equal(new DueDate('monday', { targetDate: $1jan2018monday }).isDue, IsDue.Due, 'monday');
		assert.equal(new DueDate('mon', { targetDate: $1jan2018monday }).isDue, IsDue.Due, 'mon');
	});
	it('monday is not due on any other day', () => {
		assert.equal(new DueDate('monday', { targetDate: $2jan2018tuesday }).isDue, IsDue.NotDue, 'tuesday');
		assert.equal(new DueDate('monday', { targetDate: $3jan2018wednesday }).isDue, IsDue.NotDue, 'wednesday');
		assert.equal(new DueDate('monday', { targetDate: $4jan2018thursday }).isDue, IsDue.NotDue, 'thursday');
		assert.equal(new DueDate('monday', { targetDate: $5jan2018friday }).isDue, IsDue.NotDue, 'friday');
		assert.equal(new DueDate('monday', { targetDate: $6jan2018saturday }).isDue, IsDue.NotDue, 'saturday');
		assert.equal(new DueDate('monday', { targetDate: $7jan2018sunday }).isDue, IsDue.NotDue, 'sunday');
	});
	it('tuesday', () => {
		assert.equal(new DueDate('tuesday', { targetDate: $2jan2018tuesday }).isDue, IsDue.Due, 'tuesday');
		assert.equal(new DueDate('tue', { targetDate: $2jan2018tuesday }).isDue, IsDue.Due, 'tue');
	});
	it('wednesday', () => {
		assert.equal(new DueDate('wednesday', { targetDate: $3jan2018wednesday }).isDue, IsDue.Due, 'wednesday');
		assert.equal(new DueDate('wed', { targetDate: $3jan2018wednesday }).isDue, IsDue.Due, 'wed');
	});
	it('thursday', () => {
		assert.equal(new DueDate('thursday', { targetDate: $4jan2018thursday }).isDue, IsDue.Due, 'thursday');
		assert.equal(new DueDate('thu', { targetDate: $4jan2018thursday }).isDue, IsDue.Due, 'thu');
	});
	it('friday', () => {
		assert.equal(new DueDate('friday', { targetDate: $5jan2018friday }).isDue, IsDue.Due, 'friday');
		assert.equal(new DueDate('fri', { targetDate: $5jan2018friday }).isDue, IsDue.Due, 'fri');
	});
	it('saturday', () => {
		assert.equal(new DueDate('saturday', { targetDate: $6jan2018saturday }).isDue, IsDue.Due, 'saturday');
		assert.equal(new DueDate('sat', { targetDate: $6jan2018saturday }).isDue, IsDue.Due, 'sat');
	});
	it('sunday', () => {
		assert.equal(new DueDate('sunday', { targetDate: $7jan2018sunday }).isDue, IsDue.Due, 'sunday');
		assert.equal(new DueDate('sun', { targetDate: $7jan2018sunday }).isDue, IsDue.Due, 'sun');
	});
});

describe('♻ Recurring with starting date', () => {
	const dueString = '2018-01-01|e2d';

	it(`${dueString} is due on the same day`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2018, 0, 1) }).isDue, IsDue.Due);
	});
	it(`${dueString} is not due on the next day`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2018, 0, 2) }).isDue, IsDue.NotDue);
	});
	it(`${dueString} is due in 2 days`, () => {
		assert.equal(new DueDate(dueString, { targetDate: new Date(2018, 0, 3) }).isDue, IsDue.Due);
	});
});

describe('Comma delimited `,`', () => {
	it('`mon,sun`', () => {
		assert.equal(new DueDate('mon,sun', { targetDate: $1jan2018monday }).isDue, IsDue.Due);
		assert.equal(new DueDate('mon,sun', { targetDate: $7jan2018sunday }).isDue, IsDue.Due);
		assert.equal(new DueDate('mon,sun', { targetDate: $2jan2018tuesday }).isDue, IsDue.NotDue);
		assert.equal(new DueDate('mon,sun', { targetDate: $3jan2018wednesday }).isDue, IsDue.NotDue);
		assert.equal(new DueDate('mon,sun', { targetDate: $4jan2018thursday }).isDue, IsDue.NotDue);
		assert.equal(new DueDate('mon,sun', { targetDate: $5jan2018friday }).isDue, IsDue.NotDue);
		assert.equal(new DueDate('mon,sun', { targetDate: $6jan2018saturday }).isDue, IsDue.NotDue);
	});
});

describe('🚫 Invalid due date', () => {
	it('Due date should have `invalid` state', () => {
		assert.equal(new DueDate('2020').isDue, IsDue.Invalid, '2020');
		assert.equal(new DueDate('2020-05-2').isDue, IsDue.Invalid, '2020-05-2');
		assert.equal(new DueDate('2020-07-31|e14').isDue, IsDue.Invalid, '2020-07-31|e14');
		assert.equal(new DueDate('2020-07-35').isDue, IsDue.Invalid, '2020-07-35');
	});
});

