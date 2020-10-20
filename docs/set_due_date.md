## Set due date helper function

example | description
--- | ---
`+0`|today
`+1`|tomorrow
`+1d`|tomorrow
`+1w`|in one week
`-1w`|one week ago
`-1`|yesterday
`20`|closest future 20th date. If current date is <= 20, then it would be 20th of the current month. Otherwise, 20th of the next month.
`fri` or `friday`|closest future friday date.