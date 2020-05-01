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
	it('3 multiple projects have correct Ranges', () => {
		const task = parseLine(lineAt(3))!;
		const projectRanges = [new Range(3, 2, 3, 6), new Range(3, 12, 3, 16), new Range(3, 17, 3, 23)];
		for (let i = 0; i < task.projectRanges.length; i++) {
			const range = task.projectRanges[i];
			expect(range.isEqual(projectRanges[i]));
		}
	});
});

describe('Contexts', () => {
	it('4 multiple contexts @Context', () => {
		const task = parseLine(lineAt(4))!;
		expect(task.contexts).to.have.all.members(['One', 'Two', 'Three']);
	});
	it('4 multiple contexts have correct Ranges', () => {
		const task = parseLine(lineAt(4))!;
		const contextRanges = [new Range(4, 2, 4, 6), new Range(4, 12, 4, 16), new Range(4, 17, 4, 23)];
		for (let i = 0; i < task.contextRanges.length; i++) {
			const range = task.contextRanges[i];
			expect(range.isEqual(contextRanges[i]));
		}
	});
});
describe('Tags', () => {
	it('5 multiple tags #tag1#tag2', () => {
		const task = parseLine(lineAt(5))!;
		expect(task.tags).to.have.all.members(['one', 'two', 'three', 'four']);
	});
});
describe('Priority', () => {
	it('6 single priority', () => {
		const task = parseLine(lineAt(6))!;
		expect(task.priority).to.equal('C');
	});
});
