/**
 * @param a small number
 * @param b big number
 */
export function percentage(a: number, b: number): number {
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
		lowercaseLetterA = 65,
		lowercaseLetterZ = 90,
		uppercaseLetterA = 97,
		uppercaseLetterZ = 122,

		lowercaseBoldLetterA = 120276,
		uppercaseBoldLetterA = 120302,
	}
	let result = '';
	for (const letter of str) {
		const codePoint = letter.codePointAt(0);
		if (!codePoint) {
			continue;
		}
		if (codePoint >= Unicode.lowercaseLetterA && codePoint <= Unicode.lowercaseLetterZ) {
			result += String.fromCodePoint(codePoint + Unicode.lowercaseBoldLetterA - Unicode.lowercaseLetterA);
		} else if (codePoint >= Unicode.uppercaseLetterA && codePoint <= Unicode.uppercaseLetterZ) {
			result += String.fromCodePoint(codePoint + Unicode.uppercaseBoldLetterA - Unicode.uppercaseLetterA);
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
