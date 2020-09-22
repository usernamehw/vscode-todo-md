# ![stable icon](./stable.png)  How to enable proposed api in Stable version

Launch vscode with `--enable-proposed-api usernamehw.todo-md` command line flag.

```bash
code --enable-proposed-api usernamehw.todo-md
```

# ![insiders icon](./insiders.png) How to enable proposed api in Insiders version

Using Insiders version it's possible to add extension to `args.json` file (Persistent cli arguments).

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
