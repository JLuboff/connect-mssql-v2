# ChangeLog
All project updates will be documented in this file

## [Unreleased]
- Updated typings
    - Currently awaiting updated `express-session` typings to update (I believe this will not be until v2 of `express-session` comes out)
    - This will most likely have breaking changes (and thus be v2.0.0)

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