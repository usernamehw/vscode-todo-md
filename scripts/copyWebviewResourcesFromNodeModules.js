const fs = require('fs');

fs.copyFile('node_modules/vscode-codicons/dist/codicon.css', 'media/codicon.css', (err) => {
	if (err) throw err;
	console.log('✅ codeicon.css copy success');
});
fs.copyFile('node_modules/vscode-codicons/dist/codicon.ttf', 'media/codicon.ttf', (err) => {
	if (err) throw err;
	console.log('✅ codicon.ttf copy success');
});