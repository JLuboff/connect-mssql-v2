[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/JLuboff/connect-mssql-v2)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![npm](https://img.shields.io/npm/v/connect-mssql-v2)
![npm](https://img.shields.io/npm/dw/connect-mssql-v2)
![GitHub issues](https://img.shields.io/github/issues-raw/jluboff/connect-mssql-v2)
![GitHub issues](https://img.shields.io/github/issues-pr-raw/jluboff/connect-mssql-v2)

# connect-mssql-v2

SQL Server session store for Connect/Express based on [node-mssql][mssql-url] and the deprecated/abandoned project [connect-mssql][connect-mssql-url].

## Warning 
Typings will be changed in future versions due to awaiting `express-session` updated typings. Currently they may not be fully accurate.

## Installation

    npm install connect-mssql-v2

## Prerequisites

Before you can use session store, you must create a table. Recommended table name is `sessions` but you can change it via options.

```sql
CREATE TABLE [dbo].[sessions](
    [sid] [nvarchar](255) NOT NULL PRIMARY KEY,
    [session] [nvarchar](max) NOT NULL,
    [expires] [datetime] NOT NULL
)
```

## Usage
Javascript
```javascript
const session = require('express-session');
const MSSQLStore = require('connect-mssql-v2')(session);

const config = {
  user: '...',
  password: '...',
  server: 'localhost', // You can use 'localhost\\instance' to connect to named instance
  database: '...',

  options: {
    encrypt: true // Use this if you're on Windows Azure
  }
};

app.use(
  session({
    store: new MSSQLStore(config, options), // options are optional
    secret: 'supersecret'
  })
);
```
Typescript
```javascript
import session from 'express-session';
import connectSessionStore from 'connect-mssql-v2';
const MSSQLStore = connectSessionStore(session);

const config = {
  user: '...',
  password: '...',
  server: 'localhost', // You can use 'localhost\\instance' to connect to named instance
  database: '...',

  options: {
    encrypt: true // Use this if you're on Windows Azure
  }
};

app.use(
  session({
    store: new MSSQLStore(config, options), // options are optional
    secret: 'supersecret'
  })
);
```
### Options

- **options.table** - Table to use as session store. Default: `[sessions]`
- **options.ttl** - (Time To Live) Determines the expiration date. Default: `1000 * 60 * 60 * 24` (24 hours)
- **options.autoRemove** - Determines if expired sessions should be autoremoved or not. If value is `true` then a new function, `destroyExpired()`, will autodelete expired sessions on a set interval. Default: `false`
- **options.autoRemoveInterval** - Sets the timer interval for each call to `destroyExpired()`. Default: `1000 * 60 * 10` (10 min)
- **options.autoRemoveCallback** - Is the callback function for `destroyExpired()`. Default: `undefined`
- **options.useUTC** - Determines if we are to use the `GETUTCDATE` instead of `GETDATE` Default: `true`

### Advanced usage

```javascript
const store = new MSSQLStore(config, options);

store.on('connect', () => {
	// ... connection established
});

store.on('error', (error) => {
	// ... connection error
});

store.on('sessionError', (error, classMethod) => {
  // ... any error that occurs within a store method
  // classMethod will return the method name (get, set, length, etc)
})
app.use(session({
    store: store
    secret: 'supersecret'
}));
```

## Configuration

To see all options please visit [node-mssql docs](https://github.com/patriksimek/node-mssql#cfg-basic).

## Contributions
Contributions are welcome, please submit a PR which will be reviewed.

## Reporting Issues
Please report issues/errors to Github's issue tracker: [connect-mssql-v2 issue tracker](https://github.com/JLuboff/connect-mssql-v2/issues).
Include issue, expected behavior, and how to replicate the issue.

## License

[MIT License](https://github.com/JLuboff/connect-mssql-v2/blob/master/LICENSE)

[mssql-url]: https://github.com/patriksimek/node-mssql
[connect-mssql-url]: https://github.com/patriksimek/connect-mssql
