import { describe, it } from 'mocha';
import vscode, { Range, Position, Selection } from 'vscode';
import { expect } from 'chai';

import { parseLine } from '../../parse';
import { DueState } from '../../types';

const editor = vscode.window.activeTextEditor!;

function lineAt(n: number) {
	return editor.document.lineAt(n);
}
// ──────────────────────────────────────────────────────────────────────
describe('Comment', () => {
	it('0 Should not produce a task', () => {
		const task = parseLine(lineAt(0));
		expect(task).to.be.an('undefined');
	});
});

describe('Parsing text', () => {
	it('1 just text task (should not produce any extra properties)', () => {
		const task = parseLine(lineAt(1))!;
		expect(task.title).to.equal('1 just text task');
		expect(task.done).to.equal(false);
		expect(task.isRecurring).to.equal(false);
		expect(task.isDue).to.equal(DueState.notDue);
		expect(task.tags).to.have.lengthOf(0);
		expect(task.ln).to.equal(1);
		expect(task.priority).to.equal('Z');
		expect(task.contexts).to.have.lengthOf(0);
		expect(task.contextRanges).to.have.lengthOf(0);
		expect(task.projects).to.have.lengthOf(0);
		expect(task.projectRanges).to.have.lengthOf(0);
		expect(task.priorityRange).to.be.an('undefined');
		expect(task.due).to.be.an('undefined');
		expect(task.dueRange).to.be.an('undefined');
	});
});

describe('Projects', () => {
	it('2 single project +Project', () => {
		const task = parseLine(lineAt(2))!;
		expect(task.projects).to.have.all.members(['Project']);
	});
	it('3 multiple projects +Project', () => {
		const task = parseLine(lineAt(3))!;
		expect(task.projects).to.have.all.members(['One', 'Two', 'Three']);
	});
});
