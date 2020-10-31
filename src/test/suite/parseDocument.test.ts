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
		tasks = parsed.tasks;
		return Promise.resolve(undefined);
	});
	it('Multiple links', () => {
		const links = tasks[12].links;
		expect(links).to.have.length(2);
		expect(links[0].value === 'https://www.google.com/').to.be.ok;
		expect(links[1].value === 'https://github.com/').to.be.ok;
	});
	it('Multiple links ranges', () => {
		const links = tasks[12].links;
		expect(links[0].characterRange).have.same.members([9, 31]);
		expect(links[1].characterRange).have.same.members([37, 56]);
	});
	it('Special tag `{overdue}`', () => {
		expect(tasks[13].due?.isDue === DueState.overdue).to.be.ok;
	});
});
// TODO: tests for nested tasks
