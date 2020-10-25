## Set due date helper function `todomd.setDueDate`

example | description
--- | ---
`+0`|today
`+1`|tomorrow
`+1d`|tomorrow
`+1w`|in one week
`-1w`|one week ago
`+1m`|in one month
`-1m`|one month ago
`-1`|yesterday
`20`|closest future 20th date. If current date is <= 20, then it would be 20th of the current month. Otherwise, 20th of the next month.
`fri` or `friday`|closest future friday.
`nov 20` or `november 20`|closest future 20th of November.

## Set due date with autocomplete

It's also possible to set due date by typing `$` at the end of the word of the future date:

1. Type the relative date
1. Trigger suggest `editor.action.triggerSuggest`
1. Accept the suggestion

```
+10$
```