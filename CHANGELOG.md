# ChangeLog
All project updates will be documented in this file

## [Unreleased]

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