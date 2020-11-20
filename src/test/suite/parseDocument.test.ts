import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import vscode from 'vscode';
import { parseDocument } from '../../parse';
import { TheTask } from '../../TheTask';
import { DueState } from '../../types';
import { headerDelimiter } from './testUtils';

const editor = vscode.window.activeTextEditor!;

describe(`${headerDelimiter('parse document')}`, () => {
	let tasks: TheTask[] = [];
	before(async () => {
		const parsed = await parseDocument(editor.document);
		tasks = parsed.tasksAsTree;
		return Promise.resolve(undefined);
	});
	it('13 Multiple links', () => {
		const links = tasks[12].links;
		expect(links).to.have.length(2);
		expect(links[0].value === 'https://www.google.com/').to.be.ok;
		expect(links[1].value === 'https://github.com/').to.be.ok;
	});
	it('13 Multiple links ranges', () => {
		const links = tasks[12].links;
		expect(links[0].characterRange).have.same.members([9, 31]);
		expect(links[1].characterRange).have.same.members([37, 56]);
	});
	it('14 Special tag `{overdue}`', () => {
		expect(tasks[13].due?.isDue === DueState.overdue).to.be.ok;
	});
	it('16,17,18,19 Nested tasks', () => {
		const at16 = tasks[15]!;
		const at17 = tasks[15]!.subtasks[0];
		expect(at16.subtasks.length === 2).to.be.ok;
		expect(at17.subtasks.length === 1).to.be.ok;

		expect(at16.subtasks.map(task => task.title)).to.have.same.members(['17 Nested 1lvl', '19 Nested 1lvl']);
		expect(at17.subtasks.map(task => task.title)).to.have.same.members(['18 Nested 2lvl']);
	});
});

