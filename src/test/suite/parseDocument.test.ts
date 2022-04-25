import { assert } from 'chai';
import { before, describe, it } from 'mocha';
import { window } from 'vscode';
import { parseDocument } from '../../parse';
import { TheTask } from '../../TheTask';
import { DueState } from '../../types';
import { headerDelimiter } from './testUtils';

const editor = window.activeTextEditor!;

describe(`${headerDelimiter('parse document')}`, () => {
	let tasks: TheTask[] = [];
	before(async () => {
		const parsed = await parseDocument(editor.document);
		tasks = parsed.tasksAsTree;
		return Promise.resolve(undefined);
	});
	it('13 Multiple links', () => {
		const links = tasks[12].links;
		assert.lengthOf(links, 2);
		assert.equal(links[0].value, 'https://www.google.com/');
		assert.equal(links[1].value, 'https://github.com/');
	});
	it('13 Multiple links ranges', () => {
		const links = tasks[12].links;
		assert.deepEqual(links[0].characterRange, [9, 31]);
		assert.deepEqual(links[1].characterRange, [37, 56]);
	});
	it('14 Special tag `{overdue}`', () => {
		assert.equal(tasks[13].due?.isDue, DueState.overdue);
	});
	it('16,17,18,19 Nested tasks', () => {
		const at16 = tasks[15]!;
		const at17 = tasks[15]!.subtasks[0];
		assert.lengthOf(at16.subtasks, 2);
		assert.lengthOf(at17.subtasks, 1);

		assert.deepEqual(at16.subtasks.map(task => task.title), ['17 Nested 1lvl', '19 Nested 1lvl']);
		assert.deepEqual(at17.subtasks.map(task => task.title), ['18 Nested 2lvl']);
	});
});

