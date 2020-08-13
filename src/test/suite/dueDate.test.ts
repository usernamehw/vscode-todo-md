import { expect } from 'chai';
import { describe, it } from 'mocha';
import vscode from 'vscode';
import { DueDate } from '../../dueDate';
import { DueState } from '../../types';

/**
 * Ignore vscode range helper
 */
function newDueDate(dueString: string, targetDate: Date) {
	return new DueDate(dueString, new vscode.Range(0, 0, 0, 0), targetDate);
}

const $1jan2018monday = new Date(2018, 0, 1);// just an ok date, first day of the year, month, week
const $1jan2018mondayDueDate = newDueDate('2018-01-01', $1jan2018monday);

describe('Not recurring', () => {
	it('Simple date format `2018-01-01`', () => {
		expect($1jan2018mondayDueDate.isDue === DueState.due).to.be.ok;
	});
	it('`2018-01-01` is not recurring', () => {
		expect($1jan2018mondayDueDate.isRecurring === false).to.be.ok;
	});
});
