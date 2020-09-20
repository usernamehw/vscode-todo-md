# How to enable proposed api in Stable

Launch vscode with `--enable-proposed-api usernamehw.todo-md` command line flag.

# If using Insiders version

Using Insiders version it's possible to add extension to args.

Execute from Command Palette **Preferences: Configure Runtime Arguments** `workbench.action.configureRuntimeArguments`

In newly opened json file add this extension's id to the list:

```js
{
	// ...
	"enable-proposed-api": [
		"usernamehw.todo-md"
	],
}
```

TODO: use icons for vscode versions (blue for Stable, Green for Insiders)