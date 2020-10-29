const fs = require('fs');

fs.copyFile('node_modules/vscode-codicons/dist/codicon.css', 'media/vendor/codicon.css', (err) => {
	if (err) throw err;
	console.log('✅ codeicon.css copy success');
});
fs.copyFile('node_modules/vscode-codicons/dist/codicon.ttf', 'media/vendor/codicon.ttf', (err) => {
	if (err) throw err;
	console.log('✅ codicon.ttf copy success');
});

fs.copyFile('node_modules/awesomplete/awesomplete.css', 'media/vendor/awesomplete.css', (err) => {
	if (err) throw err;
	console.log('✅ awesomplete.css copy success');
});
fs.copyFile('node_modules/awesomplete/awesomplete.min.js', 'media/vendor/awesomplete.js', (err) => {
	if (err) throw err;
	console.log('✅ awesomplete.js copy success');
});