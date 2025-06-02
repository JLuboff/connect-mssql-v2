[![Gitpod ready-to-code](https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod)](https://gitpod.io/#https://github.com/JLuboff/connect-mssql-v2)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![npm](https://img.shields.io/npm/v/connect-mssql-v2)
![npm](https://img.shields.io/npm/dw/connect-mssql-v2)
![GitHub issues](https://img.shields.io/github/issues-raw/jluboff/connect-mssql-v2)
![GitHub issues](https://img.shields.io/github/issues-pr-raw/jluboff/connect-mssql-v2)

# connect-mssql-v2

SQL Server session store for Connect/Express based on [node-mssql][mssql-url] and the deprecated/abandoned project [connect-mssql][connect-mssql-url].

## Installation

    npm install connect-mssql-v2

## Prerequisites

Before you can use session store, you must create a table. Recommended table name is `sessions` but you can change it via options. The database user must have `db_datareader`, `db_datawriter`, and `db_ddladmin` permissions.

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
const MSSQLStore = require('connect-mssql-v2');

const config = {
  user: '...',
  password: '...',
  server: 'localhost', // You can use 'localhost\\instance' to connect to named instance
  database: '...',
  options: {
    encrypt: true, // Use this if you're on Windows Azure
    trustServerCertificate: true, // use this if your MS SQL instance uses a self signed certificate
  },
};

app.use(
  session({
    store: new MSSQLStore(config, options), // options are optional
    secret: 'supersecret',
  }),
);
```

Typescript

```typescript
import MSSQLStore from 'connect-mssql-v2';

const config = {
  user: '...',
  password: '...',
  server: 'localhost', // You can use 'localhost\\instance' to connect to named instance
  database: '...',
  options: {
    encrypt: true, // Use this if you're on Windows Azure
    trustServerCertificate: true, // use this if your MS SQL instance uses a self signed certificate
  },
};

app.use(
  session({
    store: new MSSQLStore(config, options), // options are optional
    secret: 'supersecret',
  }),
);
```

### Options

- **options.table** - Table to use as session store. Default: `[sessions]`
- **options.ttl** - (Time To Live) Determines the expiration date. Default: `1000 * 60 * 60 * 24` (24 hours)
- **options.autoRemove** - Determines if expired sessions should be autoremoved or not. If value is `true` then a new function, `destroyExpired()`, will autodelete expired sessions on a set interval. Default: `false`
- **options.autoRemoveInterval** - Sets the timer interval for each call to `destroyExpired()`. Default: `1000 * 60 * 10` (10 min)
- **options.preRemoveCallback** - Is the callback function for `destroyExpired()` that is called before the actual removal.
  If this returns a promise, the removal will wait for the promise to resolve. Default: `undefined`
- **options.autoRemoveCallback** - Is the callback function for `destroyExpired()`. Default: `undefined`
- **options.useUTC** - Determines if we are to use the `GETUTCDATE` instead of `GETDATE` Default: `true`
- **options.retries** - The number of times to retry a DB connection before failing. Default: `0` (tries once)
- **options.retryDelay** - The retry delay in milliseconds. Default: `1000`

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

To see all options please visit [node-mssql docs](https://github.com/tediousjs/node-mssql#general-same-for-all-drivers).

## Upgrading from v5.x.x to v6.x.x

Ensure you're running Node >= v17

## Upgrading from v4.x.x to v5.x.x

Ensure you're running Node >=v15

## Upgrading from v3.x.x to v4.x.x

Ensure you're running Node >=v13

## Upgrading from v2.x.x to v3.x.x

The key step to upgrading is to include

```typescript
trustServerCertificate: true;
```

in your options object for the store config (see either javascript or typescript example) if running a local instance of MS SQL with a self signed certificate. If you do not provide this, you will get a connection error

```
ConnectionError: Failed to connect to databaseserver:1433 - self signed certificate
```

## Upgrading from v1.x.x to v2.x.x

It is no longer required to pass in the `express-session` store. Please see the Usage section on the updated import/require method.

## Contributions

Contributions are welcome, please submit a PR which will be reviewed.

## Reporting Issues

Please report issues/errors to Github's issue tracker: [connect-mssql-v2 issue tracker](https://github.com/JLuboff/connect-mssql-v2/issues).
Include issue, expected behavior, and how to replicate the issue.

## License

[MIT License](https://github.com/JLuboff/connect-mssql-v2/blob/master/LICENSE)

[mssql-url]: https://github.com/patriksimek/node-mssql
[connect-mssql-url]: https://github.com/patriksimek/connect-mssql
