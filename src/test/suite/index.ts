import * as path from 'path';
import Mocha from 'mocha';
import glob from 'glob';

export async function run(): Promise<void> {
	// Create the mocha test
	const mocha = new Mocha({
		ui: 'tdd',
	});
	// @ts-ignore
	mocha.color(true);
	mocha.timeout(10000);

	const testsRoot = path.resolve(__dirname, '..');

	return new Promise((c, e) => {
		// eslint-disable-next-line consistent-return
		glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
			if (err) {
				return e(err);
			}

			// Add files to the test suite
			files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

			try {
				// Run the mocha test
				mocha.run(failures => {
					if (failures > 0) {
						e(new Error(`${failures} tests failed.`));
					} else {
						c();
					}
				});
			// eslint-disable-next-line @typescript-eslint/no-shadow
			} catch (err) {
				console.error(err);
				e(err);
			}
		});
	});
}
