# ChangeLog

All project updates will be documented in this file

## [v5.2.0] - 2025-05-22

- Adds optional retry attempts to database connection
  - Credit to: @delfuego
  - Issue: github.com/JLuboff/connect-mssql-v2/issues/81
- Updates all minor/patch dependencies
  - @types/express-session ^1.17.10 → ^1.18.1
  - @types/jest ^29.5.11 → ^29.5.14
  - @types/mssql ^9.1.4 → ^9.1.7
  - dotenv ^16.3.1 → ^16.5.0
  - eslint-plugin-import ^2.29.1 → ^2.31.0
  - express-session ^1.17.3 → ^1.18.1
  - prettier ^3.1.1 → ^3.5.3
  - typescript ^5.3.3 → ^5.8.3

## [v5.1.0] - 2024-05-28

- Adds the optional `preRemoveCallback` property to the store options.
  - This callback is executed within the `destroyExpired` method prior to the removal of sessions.
  - Credit to: @bradtaniguchi
  - Issue: https://github.com/JLuboff/connect-mssql-v2/issues/72

## [v5.0.1] - 2023-12-23

- Updated packages to current versions
  - @types/express-session ^1.17.9 → ^1.17.10
  - @types/jest ^29.5.6 → ^29.5.11
  - @types/mssql ^9.1.2 → ^9.1.4
  - @typescript-eslint/eslint-plugin ^6.9.0 → ^6.15.0
  - @typescript-eslint/parser ^6.9.0 → ^6.15.0
  - eslint ^8.52.0 → ^8.56.0
  - eslint-plugin-import ^2.29.0 → ^2.29.1
  - lint-staged ^15.0.2 → ^15.2.0
  - prettier ^3.0.3 → ^3.1.1
  - ts-node ^10.9.1 → ^10.9.2
  - typescript ^5.2.2 → ^5.3.3

## [v5.0.0] - 2023-10-23

- Drops support for Node <=v14 due to `mssql@10.0.1`
- lint-staged updated to latest version, requires Node v18.12.0 (only affects dev)
- Updated packages to current versions
  - @types/express-session ^1.17.7 → ^1.17.9
  - @types/jest ^29.5.4 → ^29.5.6
  - @types/mssql ^8.1.2 → ^9.1.2
  - @typescript-eslint/eslint-plugin ^6.8.0 → ^6.9.0
  - @typescript-eslint/parser ^6.8.0 → ^6.9.0
  - eslint ^8.51.0 → ^8.52.0
  - eslint-plugin-import ^2.28.1 → ^2.29.0
  - jest ^29.6.4 → ^29.7.0
  - jest-jasmine2 ^29.6.4 → ^29.7.0
  - lint-staged ^14.0.1 → ^15.0.2
  - mssql ^9.2.0 → ^10.0.1

## [v4.0.2] - 2023-08-29

- Updated packages to current versions
  - @types/jest ^29.5.3 → ^29.5.4
  - @typescript-eslint/eslint-plugin ^6.1.0 → ^6.5.0
  - @typescript-eslint/parser ^6.1.0 → ^6.5.0
  - eslint ^8.45.0 → ^8.48.0
  - eslint-plugin-import ^2.27.5 → ^2.28.1
  - husky ^8.0.0 → ^8.0.3
  - jest ^29.6.1 → ^29.6.4
  - jest-jasmine2 ^29.6.1 → ^29.6.4
  - lint-staged ^13.2.3 → ^14.0.1
  - mssql ^9.1.1 → ^9.2.0
  - prettier ^3.0.0 → ^3.0.3
  - typescript ^5.1.6 → ^5.2.2

## [v4.0.1] - 2023-07-18

- Updated lint-staged to include linting
- Updated packages to current versions
  - @types/jest ^29.5.1 → ^29.5.3
  - @typescript-eslint/eslint-plugin ^5.59.6 → ^6.1.0
  - @typescript-eslint/parser ^5.59.6 → ^6.1.0
  - dotenv ^16.0.3 → ^16.3.1
  - eslint ^8.40.0 → ^8.45.0
  - eslint-config-airbnb-typescript ^17.0.0 → ^17.1.0
  - jest ^29.5.0 → ^29.6.1
  - jest-jasmine2 ^29.5.0 → ^29.6.1
  - lint-staged ^13.2.2 → ^13.2.3
  - prettier ^2.8.8 → ^3.0.0
  - typescript ^5.0.4 → ^5.1.6

## [v4.0.0] - 2023-05-18

- Potential breaking changes
  - Removes support for Node version <= 12 due to MSSQL v9
  - Removes IMSSQLStore interface in favor of MSSQLStoreDef
  - Update types for `err`/`error` from `any` to `unknown`
- Minor refactoring
- Updated packages to current version
  - @types/express-session ^1.17.5 → ^1.17.7
  - @types/jest ^28.1.6 → ^29.5.1
  - @types/mssql ^8.0.3 → ^8.1.2
  - @typescript-eslint/eslint-plugin ^5.30.7 → ^5.59.6
  - @typescript-eslint/parser ^5.30.7 → ^5.59.6
  - dotenv ^16.0.1 → ^16.0.3
  - eslint ^8.20.0 → ^8.40.0
  - eslint-plugin-import ^2.26.0 → ^2.27.5
  - husky ^8.0.1 → ^8.0.3
  - jest ^28.1.3 → ^29.5.0
  - jest-jasmine2 ^28.1.3 → ^29.5.0
  - lint-staged ^13.0.3 → ^13.2.2
  - mssql ^8.1.2 → ^9.1.1
  - prettier ^2.7.1 → ^2.8.8
  - typescript ^4.7.4 → ^5.0.4

## [v3.1.4] - 2022-07-21

- Updated packages to current version
  - mssql ^8.1.0 → ^8.1.2
  - @types/express-session ^1.17.4 → ^1.17.5
  - @types/jest ^27.4.1 → ^28.1.6
  - @types/mssql ^7.1.5 → ^8.0.3
  - @typescript-eslint/eslint-plugin ^5.21.0 → ^5.30.7
  - @typescript-eslint/parser ^5.21.0 → ^5.30.7
  - dotenv ^16.0.0 → ^16.0.1
  - eslint ^8.14.0 → ^8.20.0
  - express-session ^1.17.2 → ^1.17.3
  - husky ^7.0.4 → ^8.0.1
  - jest ^28.0.1 → ^28.1.3
  - jest-jasmine2 ^28.0.1 → ^28.1.3
  - lint-staged ^12.4.1 → ^13.0.3
  - prettier ^2.6.2 → ^2.7.1
  - ts-node ^10.7.0 → ^10.9.1
  - typescript ^4.6.3 → ^4.7.4

## [v3.1.3] - 2022-04-25

- Updated packages to current version
  - @typescript-eslint/eslint-plugin ^5.15.0 → ^5.21.0
  - @typescript-eslint/parser ^5.15.0 → ^5.21.0
  - eslint ^8.11.0 → ^8.14.0
  - eslint-config-airbnb-typescript ^16.1.3 → ^17.0.0
  - eslint-plugin-import ^2.25.4 → ^2.26.0
  - jest ^27.5.1 → ^28.0.1
  - lint-staged ^12.3.7 → ^12.4.1
  - prettier ^2.6.0 → ^2.6.2
  - typescript ^4.6.2 → ^4.6.3
  - mssql ^8.0.2 → ^8.1.0
- Added `jest-jasmine2` as a dev dependency as it is no longer included with `jest` (update from v27 to v28)

## [v3.1.2] - 2022-03-18

- Updated packages to current version
  - @types/jest ^27.4.0 → ^27.4.1
  - @types/mssql ^7.1.4 → ^7.1.5
  - @typescript-eslint/eslint-plugin ^5.9.0 → ^5.15.0
  - @typescript-eslint/parser ^5.9.0 → ^5.15.0
  - dotenv ^10.0.0 → ^16.0.0
  - eslint ^8.6.0 → ^8.11.0
  - eslint-config-airbnb-typescript ^16.1.0 → ^16.1.3
  - jest ^27.4.7 → ^27.5.1
  - lint-staged ^12.1.7 → ^12.3.7
  - prettier ^2.5.1 → ^2.6.0
  - ts-node ^10.4.0 → ^10.7.0
  - typescript ^4.5.4 → ^4.6.2
  - mssql ^7.3.0 → ^8.0.2

## [v3.1.1] - 2022-01-07

- Turned off ESLint rule: "import/no-import-module-exports"
- Added coverage folder to tsconfig exlcude
- Updated packages to current version
  - @types/jest ^27.0.2 → ^27.4.0
  - @typescript-eslint/eslint-plugin ^5.2.0 → ^5.9.0
  - @typescript-eslint/parser ^5.2.0 → ^5.9.0
  - eslint ^8.1.0 → ^8.6.0
  - eslint-config-airbnb-base ^14.2.1 → ^15.0.0
  - eslint-config-airbnb-typescript ^14.0.1 → ^16.1.0
  - eslint-plugin-import ^2.25.2 → ^2.25.4
  - jest ^27.3.1 → ^27.4.7
  - lint-staged ^11.2.6 → ^12.1.7
  - prettier ^2.4.1 → ^2.5.1
  - typescript ^4.4.4 → ^4.5.4
  - mssql ^7.2.1 → ^7.3.0

## [v3.1.0] - 2021-11-03

- PR #52 closed (Refactor)
  - Replaced private `ready` method with private `dbReadyCheck` method. -`dbReadyCheck` is an async method as opposed to using a callback
    - Moved all DB checks from within each method to our new method `queryRunner`
  - Created private `queryRunner` method
    - Each method requiring database querying will be ran through this method
  - Made store methods `async`
    - Removed unneeded `return` as we are no longer working within a callback
  - Corrected typings for `destroyExpired` method
  - Wrote test for `clear` method
  - Renamed `IMSSQLStore` interface to `MSSQLStoreDef`
    - Changed `IMSSQLStore` to extend `MSSQLStoreDef` and added deprecation warning
  - Changed argument name from `session` to `currentSession` for `set` and `touch` methods due to importing `session` namespace
  - Ran `npm audit fix` which resolves 2 vulnerabilities with `axios`

## [v3.0.1] - 2021-10-28

- Updated packages to current version
  - @types/jest ^26.0.20 → ^27.0.2
  - @types/mssql ^7.1.3 → ^7.1.4
  - @typescript-eslint/eslint-plugin ^4.30.0 → ^5.2.0
  - @typescript-eslint/parser ^4.30.0 → ^5.2.0
  - eslint ^7.32.0 → ^8.1.0
  - eslint-config-airbnb-typescript ^14.0.0 → ^14.0.1
  - eslint-plugin-import ^2.24.2 → ^2.25.2
  - husky ^7.0.2 → ^7.0.4
  - jest ^26.6.3 → ^27.3.1
  - lint-staged ^11.1.2 → ^11.2.6
  - prettier ^2.3.2 → ^2.4.1
  - ts-node ^10.2.1 → ^10.4.0
  - typescript ^4.4.2 → ^4.4.4
- Fixed a test that was using async/await. Moved the secondary function (with expect) to outer function callback.

## [v3.0.0] - 2021-08-31

- Fix #47
  - Added module.exports = MSSQLStore to store file to correct issue with using require statement
  - Added new JS test file to verify require statement
- README updated
  - Address changes to SQL Config options as required for `mssql` changes as well as noting required database user permissions
  - Added section on upgrading from v2.x.x to v3.x.x
- Updated packages to current version
  - @types/express-session ^1.17.3 → ^1.17.4
  - @types/mssql ^6.0.7 → ^7.1.3
  - @typescript-eslint/eslint-plugin ^4.14.2 → ^4.30.0
  - @typescript-eslint/parser ^4.14.2 → ^4.30.0
  - dotenv ^8.2.0 → ^10.0.0
  - eslint ^7.19.0 → ^7.32.0
  - eslint-plugin-import ^2.22.1 → ^2.24.2
  - eslint-config-airbnb-typescript ^12.0.0 → ^14.0.0
  - express-session ^1.17.1 → ^1.17.2
  - husky ^4.3.8 → ^7.0.2
  - lint-staged ^10.5.4 → ^11.1.2
  - prettier ^2.2.1 → ^2.3.2
  - typescript ^4.1.3 → ^4.4.2
  - mssql ^6.3.1 → ^7.2.1
- Added `eslint-config-airbnb-base` for proper linting
- Added `ts-node` package to properly handle jest.config.ts file

## [v2.0.2] - 2021-02-05

- Updated packages to current version
  - @typescript-eslint/eslint-plugin
  - @typescript-eslint/parser
  - eslint
  - lint-staged

## [v2.0.0] - 2021-01-20

- Major Release with breaking changes
  - Removed encapsulation around MSSQLStore, no longer requiring to pass in session store
  - TS will now provide proper typings
  - Updated test file to reflect changes
  - Updated README to reflect changes
- Updated packages to current version
  - @types/mssql
  - @types/jest
  - @typescript-eslint/eslint-plugin
  - @typescript-eslint/parser
  - eslint
  - husky
  - lint-staged
  - mssql
  - typescript

## [v1.6.3] - 2020-10-07

- Merged PR #33 submitted by @bradtaniguchi
  - Fixed an issue where `require('connect-mssql-v2')(session)` was throwing a TypeError (require is not a function)

## [v1.6.2] - 2020-10-02

- Merged PR #30
  - Updated packages to current version
    - @types/mssql
    - @typescript-eslint/eslint-plugin
    - @typescript-eslint/parser
    - eslint-config-airbnb-typescript
  - Disabled eslint rule no-undef
  - Removed arguments from errorHandler this.databaseConnection.once

## [v1.6.1] - 2020-09-28

- Merged PR #28 submitted by @master117
  - Changed result set from `all` method
- Updated packages
  - @types/jest
  - @typescript-eslint/eslint-plugin
  - @typescript-eslint/parser
  - eslint
  - eslint-plugin-import
  - lint-staged
  - mssql
  - prettier
  - typescript

## [v1.6.0] - 2020-09-15

- Merged PR #27 submitted by @master117 (Thanks for the contribution!)
  - Added support for `all` method which pulls all sessions from the table
- Fixed typings for `all` method to indicate it returns an array
- Added test for `all` method
- Updated packages
  - @types/mssql
  - @types/jest
  - jest
  - typescript
  - husky
  - eslint
  - lint-staged
  - prettier

## [v1.5.0] - 2020-08-18

- Updated README
  - Added various badges
  - Added typescript example
  - Added Reporting Issues section
  - Removed MIT license text in favor of link to license file
- Updated package.json
  - @bradtaniguchi added lint script, along with husky/prettier pre-commit hooks
  - Moved `@types/mssql` to devDependencies
  - Updated all packages to latest at time of writing
- Updated ESLint config to include `parserOptions`
- Work started on creating Gitpod environment for dev

## [v1.4.1] - 2020-02-28

- Removed the following types: GetCallback, CommonCallback, LengthCallback, and StoreError.
  - Replaced with generic in place typings (i.e `(err?: any) => void`)
- Updated README to include note on typings and contributors
- Updated all packages

## [v1.4.0] - 2020-02-03

- Modified most methods to first check if callback exists before calling it (fix #11)
- Refactored to remove `.call` and `.bind` in most places
- Updated all packages

## [v1.3.0] - 2019-12-17

- Changed sessionError event listener from using `on` to `once`
  - Should no longer attach multiples of the same listener
- Refactored to use optional chaining
- Refactored `return callback(error)` to `throw error`

## [v1.2.0] - 2019-12-06

- Added sessionError event listener
  - Emits error and method in which error occured
- Check for callback existence before calling

## [v1.1.1] - 2019-12-05

- Migrate from TSLint to ESLint and re-lint files

## [v1.1.0] - 2019-11-22

- Typings updated [bf08351]
  - data property changed to session, use Express.SessionData type
  - cast session argument
- Ensure we do not send boolean into expires Date constructor (set and touch methods)

## [v1.0.3] - 2019-11-21

- Changed database initialization to only occur on first connect OR if disconnected
  - Connect event only emits once (unless disconnected and needs to reconnect)
