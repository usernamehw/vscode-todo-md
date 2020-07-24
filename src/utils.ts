import { promises as fs } from 'fs';

export async function appendTaskToFile(text: string, filePath: string) {
	await fs.appendFile(filePath, `${text}\n`);// TODO: check if file ends with \n before writing
}

export function getRandomInt(min: number, max: number): number {
	return min + Math.floor(Math.random() * (max - min + 1));
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
