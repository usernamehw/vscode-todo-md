const fs = require('fs');
const { exec } = require('child_process');

const vendorPath = './media/vendor';

if (!fs.existsSync(vendorPath)) {
	fs.mkdirSync(vendorPath);
}

fs.unlink('./media/vendor/codicon.css', (err) => {
	if (err) {
		console.error(err);
	}
	exec('npm run copyAndCompressVendorCss');
	console.log('✅ codeicon.css copy success');
})

fs.copyFile('node_modules/@vscode/codicons/dist/codicon.ttf', 'media/vendor/codicon.ttf', (err) => {
	if (err) throw err;
	console.log('✅ codicon.ttf copy success');
});
