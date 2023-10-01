
/**
 * @param a part number
 * @param b 100% number
 */
export function percentage(a: number, b: number): number {
	if (b === 0) {
		return 0;
	}
	return a / b * 100;
}
/**
 * Replace numbers with emoji.
 */
export function fancyNumber(n: number): string {
	const digitMap = ['0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];
	return String(n)
		.split('')
		.map(digit => digitMap[Number(digit)])
		.join('');
}
/**
 * Replace english letters with their bold `utf-8` variant (hack).
 */
export function fancyLetterBold(str: string) {
	const enum Unicode {
		LowercaseLetterA = 65,
		LowercaseLetterZ = 90,
		UppercaseLetterA = 97,
		UppercaseLetterZ = 122,

		LowercaseBoldLetterA = 120276,
		UppercaseBoldLetterA = 120302,
	}
	let result = '';
	for (const letter of str) {
		const codePoint = letter.codePointAt(0);
		if (!codePoint) {
			continue;
		}
		if (codePoint >= Unicode.LowercaseLetterA && codePoint <= Unicode.LowercaseLetterZ) {
			result += String.fromCodePoint(codePoint + Unicode.LowercaseBoldLetterA - Unicode.LowercaseLetterA);
		} else if (codePoint >= Unicode.UppercaseLetterA && codePoint <= Unicode.UppercaseLetterZ) {
			result += String.fromCodePoint(codePoint + Unicode.UppercaseBoldLetterA - Unicode.UppercaseLetterA);
		} else {
			result += letter;
		}
	}
	return result;
}

/**
 * Add `s` suffix depending if there are more than 1 thing.
 */
// export function pluralize(n: number) {
// 	return n === 1 ? '' : 's';
// }

/**
 * Await specified amount of ms
 */
export async function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Keep only unique items in array. Works only with primitives;
 */
export function unique<T extends boolean | number | string>(arr: T[]): T[] {
	return Array.from(new Set(arr));
}
/**
 * Check if the object doesn't have any keys
 */
export function isEmptyObject(obj: any) {
	return Object.keys(obj).length === 0;
}
export class UnsupportedValueError extends Error {
	/**
	 * Exhaustive type checking.
	 */
	constructor(value: never) {
		super(`Unsupported value: ${value}`);
	}
}

type Truthy<T> = T extends '' | 0 | false | null | undefined ? never : T;
/**
 * filter(Boolean) doesn't work in TypeScript as expected.
 */
export function guardedBoolean<T>(value: T): value is Truthy<T> {
	return Boolean(value);
}
/**
 * Cut off the end of the string if it's longer than provided number of characters.
 */
export function truncate(str: string, maxLength: number): string {
	const chars = [...str];
	return chars.length > maxLength ? chars.slice(0, maxLength).join('') : str;
}
