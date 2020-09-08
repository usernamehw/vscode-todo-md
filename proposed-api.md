# How to enable proposed api

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