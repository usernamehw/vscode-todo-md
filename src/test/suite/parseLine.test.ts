import { expect } from 'chai';
import { describe, it } from 'mocha';
import vscode, { Range } from 'vscode';
import { parseLine } from '../../parse';
import { TheTask } from '../../TheTask';

const editor = vscode.window.activeTextEditor!;
/**
 * Helper function to get the task excluding empty lines and comments
 */
function getLineAt(n: number): TheTask | undefined {
	const textLine = editor.document.lineAt(n);
	const task = parseLine(textLine);
	if (task.lineType === 'empty' || task.lineType === 'comment' || task.lineType === 'specialComment') {
		return undefined;
	}
	return task.value;
}
// ──────────────────────────────────────────────────────────────────────
describe('Comment', () => {
	it('0 Should not produce a task', () => {
		const line = editor.document.lineAt(0);
		const task = parseLine(line);
		expect(task?.lineType === 'comment', 'Line type is comment').to.be.ok;
	});
});

describe('Parsing text', () => {
	it('1 just text task (should not produce any extra properties)', () => {
		const task = getLineAt(1)!;
		expect(task.title).to.equal('1 just text task');
		expect(task.done).to.equal(false);
		expect(task.tags).to.have.lengthOf(0);
		expect(task.lineNumber).to.equal(1);
		expect(task.priority).to.equal('Z');
		expect(task.contexts).to.have.lengthOf(0);
		expect(task.contextRanges).to.have.lengthOf(0);
		expect(task.projects).to.have.lengthOf(0);
		expect(task.projectRanges).to.have.lengthOf(0);
		expect(task.priorityRange).to.be.an('undefined');
		expect(task.due).to.be.an('undefined');
	});
});

describe('Projects', () => {
	it('2 single project +Project', () => {
		const task = getLineAt(2)!;
		expect(task.projects).to.have.all.members(['Project']);
	});
	it('3 multiple projects +Project', () => {
		const task = getLineAt(3)!;
		expect(task.projects).to.have.all.members(['One', 'Two', 'Three']);
	});
	it('3 multiple projects have correct Ranges', () => {
		const task = getLineAt(3)!;
		const projectRanges = [new Range(3, 2, 3, 6), new Range(3, 12, 3, 16), new Range(3, 17, 3, 23)];
		for (let i = 0; i < task.projectRanges.length; i++) {
			const range = task.projectRanges[i];
			expect(range.isEqual(projectRanges[i]));
		}
	});
});

describe('Contexts', () => {
	it('4 multiple contexts @Context', () => {
		const task = getLineAt(4)!;
		expect(task.contexts).to.have.all.members(['One', 'Two', 'Three']);
	});
	it('4 multiple contexts have correct Ranges', () => {
		const task = getLineAt(4)!;
		const contextRanges = [new Range(4, 2, 4, 6), new Range(4, 12, 4, 16), new Range(4, 17, 4, 23)];
		for (let i = 0; i < task.contextRanges.length; i++) {
			const range = task.contextRanges[i];
			expect(range.isEqual(contextRanges[i]));
		}
	});
});
describe('Tags', () => {
	it('5 multiple tags #tag1#tag2', () => {
		const task = getLineAt(5)!;
		expect(task.tags).to.have.all.members(['one', 'two', 'three', 'four']);
	});
});
describe('Priority', () => {
	it('6 single priority', () => {
		const task = getLineAt(6)!;
		expect(task.priority).to.equal('C');
	});
});
describe('Completed state', () => {
	it('7 With symbol', () => {
		const task = getLineAt(7)!;
		expect(task.done).to.equal(true);
	});
	it('8 With completion date', () => {
		const task = getLineAt(8)!;
		expect(task.done).to.equal(true);
	});
});
describe('Should not produce extra tags/contexts/...', () => {
	it('9 No extra tags', () => {
		const task = getLineAt(9)!;
		expect(task.tags).to.have.lengthOf(0);
	});
	it('9 No extra contexts', () => {
		const task = getLineAt(9)!;
		expect(task.contexts).to.have.lengthOf(0);
	});
	it('9 No extra projects', () => {
		const task = getLineAt(9)!;
		expect(task.projects).to.have.lengthOf(0);
	});
	it('9 No extra special tags', () => {
		const task = getLineAt(9)!;
		expect(task.specialTagRanges).to.have.lengthOf(0);
	});
	it('9 No extra done symbol', () => {
		const task = getLineAt(9)!;
		expect(task.done).to.equal(false);
	});
});
describe('Special tags {}', () => {
	it('10 Count', () => {
		const task = getLineAt(10)!;
		expect(task.specialTags.count).to.not.be.an('undefined');
		expect(task.specialTags.count?.current).to.equal(1);
		expect(task.specialTags.count?.needed).to.equal(2);
	});
	it('11 Threshold', () => {
		const task = getLineAt(11)!;
		expect(task.specialTags.threshold).to.equal('2020-05-02');
	});
	it('12 Hidden', () => {
		const task = getLineAt(12)!;
		expect(task.specialTags.isHidden === true).to.be.ok;
	});
	// TODO: {overdue} test
	// TODO: parse links should be testing parseDocument function
	// it('13 Link', () => { // TODO: test for multiple links in one line
	// 	const task = getLineAt(13)!;
	// 	expect(task.links[0].value === 'https://www.google.com').to.be.ok;
	// });
});
