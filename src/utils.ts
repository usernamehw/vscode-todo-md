export function getRandomInt(min: number, max: number): number {
	return min + Math.floor(Math.random() * (max - min + 1));
}
/**
 * @param a small number
 * @param b big number
 */
export function percentage(a: number, b: number): number {
	return a / b * 100;
}
/**
 * Replace numbers with emoji.
 * Works for multiple digits too.
 */
export function fancyNumber(n: number): string {
	const digitMap = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
	return String(n)
		.split('')
		.map(digit => digitMap[digit])
		.join('');
}
interface NestedObject {
	subtasks: NestedObject[];
}
/**
 * Recursive function to flatten an array.
 * Nested property name is hardcoded as `subtasks`
 */
export function flattenDeep<T extends NestedObject>(arr: T[]): T[] {
	const flattened: T[] = [];
	function flatten(innerArr: T[]) {
		for (const item of innerArr) {
			flattened.push(item);
			if (item.subtasks.length) {
				// @ts-ignore
				flatten(item.subtasks);
			}
		}
	}
	flatten(arr);
	return flattened;
}
