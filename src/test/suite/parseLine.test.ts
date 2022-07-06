import { assert } from 'chai';
import { describe, it } from 'mocha';
import { Range, window } from 'vscode';
import { parseLine } from '../../parse';
import { TheTask } from '../../TheTask';
import { headerDelimiter } from './testUtils';

const editor = window.activeTextEditor!;
/**
 * Helper function to get the task excluding empty lines and comments
 */
function getTaskAt(n: number): TheTask | undefined {
	const textLine = editor.document.lineAt(n);
	const task = parseLine(textLine);
	if (task.lineType === 'empty' || task.lineType === 'comment') {
		return undefined;
	}
	return task.value;
}
// ──────────────────────────────────────────────────────────────────────
describe(`${headerDelimiter('parse')}Comment`, () => {
	it('0 Should not produce a task', () => {
		const line = editor.document.lineAt(0);
		const task = parseLine(line);
		assert.equal(task?.lineType, 'comment', 'Line type is comment');
	});
});

describe('Parsing text', () => {
	it('1 just text task (should not produce any extra properties)', () => {
		const task = getTaskAt(1)!;
		assert.equal(task.title, '1 just text task');
		assert.isFalse(task.done);
		assert.lengthOf(task.tags, 0);
		assert.equal(task.lineNumber, 1);
		assert.equal(task.priority, 'G');
		assert.lengthOf(task.contexts, 0);
		assert.lengthOf(task.contextRanges, 0);
		assert.lengthOf(task.projects, 0);
		assert.lengthOf(task.projectRanges, 0);
		assert.isUndefined(task.priorityRange);
		assert.isUndefined(task.due);
	});
});

describe('Projects', () => {
	it('2 single project +Project', () => {
		const task = getTaskAt(2)!;
		assert.deepEqual(task.projects, ['Project']);
	});
	it('3 multiple projects +Project', () => {
		const task = getTaskAt(3)!;
		assert.deepEqual(task.projects, ['One', 'Two', 'Three']);
	});
	it('3 multiple projects have correct Ranges', () => {
		const task = getTaskAt(3)!;
		const projectRanges = [new Range(3, 2, 3, 6), new Range(3, 12, 3, 16), new Range(3, 17, 3, 23)];
		for (let i = 0; i < task.projectRanges.length; i++) {
			const range = task.projectRanges[i];
			assert.isTrue(range.isEqual(projectRanges[i]));
		}
	});
});

describe('Contexts', () => {
	it('4 multiple contexts @Context', () => {
		const task = getTaskAt(4)!;
		assert.deepEqual(task.contexts, ['One', 'Two', 'Three']);
	});
	it('4 multiple contexts have correct Ranges', () => {
		const task = getTaskAt(4)!;
		const contextRanges = [
			new Range(4, 2, 4, 6),
			new Range(4, 39, 4, 43),
			new Range(4, 44, 4, 50),
		];
		for (let i = 0; i < task.contextRanges.length; i++) {
			const range = task.contextRanges[i];
			assert.isTrue(range.isEqual(contextRanges[i]));
		}
	});
});
describe('Tags', () => {
	it('5 multiple tags #tag1#tag2', () => {
		const task = getTaskAt(5)!;
		assert.deepEqual(task.tags, ['one', 'two', 'three', 'four']);
	});
});
describe('Priority', () => {
	it('6 single priority', () => {
		const task = getTaskAt(6)!;
		assert.equal(task.priority, 'C');
	});
});
describe('Completed state', () => {
	it('8 With completion date', () => {
		const task = getTaskAt(8)!;
		assert.isTrue(task.done);
	});
});
describe('Should not produce extra tags/contexts/...', () => {
	it('9 No extra entities', () => {
		const task = getTaskAt(9)!;
		assert.lengthOf(task.tags, 0, 'No extra tags');
		assert.lengthOf(task.contexts, 0, 'No extra contexts');
		assert.lengthOf(task.projects, 0, 'No extra projects');
		assert.lengthOf(task.specialTagRanges, 0, 'No extra special tags');
		assert.isFalse(task.done, 'No extra done symbol');
	});
});
describe('Special tags {}', () => {
	it('10 Count', () => {
		const task = getTaskAt(10)!;
		assert.isDefined(task.count);
		assert.equal(task.count?.current, 1);
		assert.equal(task.count?.needed, 2);
	});
	it('12 Hidden', () => {
		const task = getTaskAt(12)!;
		assert.isTrue(task.isHidden);
	});
	it('15 Collapsed', () => {
		const task = getTaskAt(15)!;
		assert.isTrue(task.isCollapsed);
	});
	it('20 Favorite', () => {
		const task = getTaskAt(20)!;
		assert.isTrue(task.favorite);
	});
});
