import { expect } from 'chai';
import dayjs from 'dayjs';
import _ from 'lodash';
import { describe, it } from 'mocha';
import { DueDate } from '../../dueDate';
import { DueState } from '../../types';
import { headerDelimiter } from './testUtils';

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
	it('Simple date format `2018-01-01`', () => {
		expect($1jan2018mondayDueDate.isDue === DueState.due).to.be.ok;
	});
	it('`2018-01-01` is not recurring', () => {
		expect($1jan2018mondayDueDate.isRecurring === false).to.be.ok;
	});
});

describe('♻ Recurring', () => {
	it('`ed` (every day alias). Is due on any day', () => {
		const ed = new DueDate('ed', {
			targetDate: addDays($1jan2018monday, _.random(-100, 100)),
		});
		expect(ed.isDue === DueState.due).to.be.ok;
	});
	it('`monday` is recurring', () => {
		expect(new DueDate('monday').isRecurring === true).to.be.ok;
	});
	it('Week days like `Monday` are case insensitive', () => {
		const mondayDueDate = new DueDate('Monday');
		expect(mondayDueDate.isDue !== DueState.invalid).to.be.ok;
		expect(mondayDueDate.isRecurring === true).to.be.ok;
	});
	it('monday', () => {
		expect(new DueDate('monday', { targetDate: $1jan2018monday }).isDue === DueState.due, 'monday').to.be.ok;
		expect(new DueDate('mon', { targetDate: $1jan2018monday }).isDue === DueState.due, 'mon').to.be.ok;
	});
	it('monday is not due on any other day', () => {
		expect(new DueDate('monday', { targetDate: $2jan2018tuesday }).isDue === DueState.notDue, 'monday').to.be.ok;
		expect(new DueDate('monday', { targetDate: $3jan2018wednesday }).isDue === DueState.notDue, 'monday').to.be.ok;
		expect(new DueDate('monday', { targetDate: $4jan2018thursday }).isDue === DueState.notDue, 'monday').to.be.ok;
		expect(new DueDate('monday', { targetDate: $5jan2018friday }).isDue === DueState.notDue, 'monday').to.be.ok;
		expect(new DueDate('monday', { targetDate: $6jan2018saturday }).isDue === DueState.notDue, 'monday').to.be.ok;
		expect(new DueDate('monday', { targetDate: $7jan2018sunday }).isDue === DueState.notDue, 'monday').to.be.ok;
	});
	it('tuesday', () => {
		expect(new DueDate('tuesday', { targetDate: $2jan2018tuesday }).isDue === DueState.due, 'tuesday').to.be.ok;
		expect(new DueDate('tue', { targetDate: $2jan2018tuesday }).isDue === DueState.due, 'tue').to.be.ok;
	});
	it('wednesday', () => {
		expect(new DueDate('wednesday', { targetDate: $3jan2018wednesday }).isDue === DueState.due, 'wednesday').to.be.ok;
		expect(new DueDate('wed', { targetDate: $3jan2018wednesday }).isDue === DueState.due, 'wed').to.be.ok;
	});
	it('thursday', () => {
		expect(new DueDate('thursday', { targetDate: $4jan2018thursday }).isDue === DueState.due, 'thursday').to.be.ok;
		expect(new DueDate('thu', { targetDate: $4jan2018thursday }).isDue === DueState.due, 'thu').to.be.ok;
	});
	it('friday', () => {
		expect(new DueDate('friday', { targetDate: $5jan2018friday }).isDue === DueState.due, 'friday').to.be.ok;
		expect(new DueDate('fri', { targetDate: $5jan2018friday }).isDue === DueState.due, 'fri').to.be.ok;
	});
	it('saturday', () => {
		expect(new DueDate('saturday', { targetDate: $6jan2018saturday }).isDue === DueState.due, 'saturday').to.be.ok;
		expect(new DueDate('sat', { targetDate: $6jan2018saturday }).isDue === DueState.due, 'sat').to.be.ok;
	});
	it('sunday', () => {
		expect(new DueDate('sunday', { targetDate: $7jan2018sunday }).isDue === DueState.due, 'sunday').to.be.ok;
		expect(new DueDate('sun', { targetDate: $7jan2018sunday }).isDue === DueState.due, 'sun').to.be.ok;
	});
});

describe('♻ Recurring with starting date', () => {
	const dueString = '2018-01-01|e2d';
	it(`${dueString} is due on the same day`, () => {
		expect(new DueDate(dueString, {
			targetDate: new Date(2018, 0, 1),
		}).isDue === DueState.due).to.be.ok;
	});
	it(`${dueString} is not due on the next day`, () => {
		const dueDate = new DueDate(dueString, {
			targetDate: new Date(2018, 0, 2),
		});
		expect(dueDate.isDue === DueState.notDue, dueDate.isDue.toString()).to.be.ok;
	});
	it(`${dueString} is due in 2 days`, () => {
		const dueDate = new DueDate(dueString, {
			targetDate: new Date(2018, 0, 3),
		});
		expect(dueDate.isDue === DueState.due, dueDate.isDue.toString()).to.be.ok;
	});
});

describe('Comma delimited `,`', () => {
	it('`mon,sun`', () => {
		expect(new DueDate('mon,sun', { targetDate: $1jan2018monday }).isDue === DueState.due).to.be.ok;
		expect(new DueDate('mon,sun', { targetDate: $7jan2018sunday }).isDue === DueState.due).to.be.ok;
		expect(new DueDate('mon,sun', { targetDate: $2jan2018tuesday }).isDue === DueState.notDue).to.be.ok;
		expect(new DueDate('mon,sun', { targetDate: $3jan2018wednesday }).isDue === DueState.notDue).to.be.ok;
		expect(new DueDate('mon,sun', { targetDate: $4jan2018thursday }).isDue === DueState.notDue).to.be.ok;
		expect(new DueDate('mon,sun', { targetDate: $5jan2018friday }).isDue === DueState.notDue).to.be.ok;
		expect(new DueDate('mon,sun', { targetDate: $6jan2018saturday }).isDue === DueState.notDue).to.be.ok;
	});
});

describe('🚫 Invalid due date', () => {
	it('Due date should have `invalid` state', () => {
		expect(new DueDate('2020').isDue === DueState.invalid, '2020').to.be.ok;
		expect(new DueDate('2020-05-2').isDue === DueState.invalid, '2020-05-2').to.be.ok;
		expect(new DueDate('2020-07-31|e14').isDue === DueState.invalid, '2020-07-31|e14').to.be.ok;
		expect(new DueDate('2020-07-35').isDue === DueState.invalid, '2020-07-35').to.be.ok;
	});
});

