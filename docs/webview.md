# Reveal the task

<kbd>Alt</kbd> + <kbd>L Mouse Button</kbd> - Reveals the task in the file

# Render tasks as markdown

You can set an option to render tasks as markdown (in Settings)

```js
"todomd.webview.markdownEnabled": true,
```

It will treat each line as separate markdown line (no multi-line features).

```
<kbd>Ctrl</kbd>+<kbd>Enter</kbd>
Some text <mark>Important</mark> text text text
**BOLD** *italic* `inline code`
<span style="display:inline-block;background:linear-gradient(0.25turn,#3f87a6,#ebf8e1,#f69d3c);color:#fff;padding:0.5rem;border-radius:3px;font-style:bold;">==========</span>
```

![webview renders markdown demo](https://raw.githubusercontent.com/usernamehw/vscode-todo-md/master/docs/img/webview.png)