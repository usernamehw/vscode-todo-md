export function headerDelimiter(header: string): string {
	const TOTAL_WIDTH = 60;
	const leftCount = Math.floor((TOTAL_WIDTH - header.length) / 2);
	const rightCount = TOTAL_WIDTH - leftCount - header.length;
	return `\n${'─'.repeat(leftCount)} ${header.toUpperCase()} ${'─'.repeat(rightCount)}\n  `;
}
