import { revealTask } from '../documentActions';

export function goToLine(lineNumber: number) {
	revealTask(lineNumber);
}
