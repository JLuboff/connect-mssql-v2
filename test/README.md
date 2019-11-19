# connect-mssql-v2 - Test running

## Prerequisites

Before running tests, you must create the following table within a MS SQL server database. 
```sql
CREATE TABLE [dbo].[sessions](
    [sid] [nvarchar](255) NOT NULL PRIMARY KEY,
    [session] [nvarchar](max) NOT NULL,
    [expires] [datetime] NOT NULL
)
```

## To run tests

- Create a .env file within the test folder with the following properties.

```javascript
SQLUSER=YourSQLUser
SQLPASSWORD=YourSQLUserPassword
SQLSERVER=YourSQLServer
SQLDATABASE=YourSQLTestDatabase
```
- Run tsc to build project
- Run `npm test`
