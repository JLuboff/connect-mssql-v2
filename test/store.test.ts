import expresssession from 'express-session';
import sql, { config } from 'mssql';
import * as dotenv from 'dotenv';
import * as path from 'path';
import sessionStore from '../src/store';

const MSSQLStore = sessionStore(expresssession);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const TESTDATA = {
  somevalue: 'yes',
  somenumber: 123,
  cookie: { expires: new Date() },
};
const MODIFIEDDATA = {
  somevalue: 'no',
  somenumber: 456,
  cookie: { expires: new Date() },
};
const TOUCHED = { cookie: { expires: new Date() } };
const sqlConfig: config = {
  user: process.env.SQLUSER,
  password: process.env.SQLPASSWORD,
  server: process.env.SQLSERVER as string,
  database: process.env.SQLDATABASE as string,
};

beforeAll(async () => {
  const db = new sql.ConnectionPool(sqlConfig);
  await db.connect();
  const request = db.request();
  await request.query('DELETE FROM dbo.Sessions');
  await db.close();
});

describe('connect-mssql-v2', () => {
  describe('Basic test suite', () => {
    const store = new MSSQLStore(sqlConfig, {
      table: 'Sessions',
    });

    test('Should not find a session', (done) => {
      store.get('1234ABC', (err: any, session: any) => {
        if (err) return done(err);

        expect(session).toBeFalsy();
        return done();
      });
    });
    test('Should create a new session', (done) => {
      store.set('1234ABC', TESTDATA, done);
    });
    test('Should get created session', (done) => {
      store.get('1234ABC', (err: any, session: any) => {
        if (err) return done(err);

        expect(session).toBeTruthy();
        expect(session.somevalue).toEqual(TESTDATA.somevalue);
        expect(session.somenumber).toEqual(TESTDATA.somenumber);
        expect(session.cookie.expires).toEqual(
          TESTDATA.cookie.expires.toISOString(),
        );
        return done();
      });
    });
    test('Should modify session', (done) => {
      store.set('1234ABC', MODIFIEDDATA, done);
    });
    test('Should get modified session', (done) => {
      store.get('1234ABC', (err: any, session: any) => {
        if (err) return done(err);

        expect(session).toBeTruthy();
        expect(session.somevalue).toEqual(MODIFIEDDATA.somevalue);
        expect(session.somenumber).toEqual(MODIFIEDDATA.somenumber);
        expect(session.cookie.expires).toEqual(
          MODIFIEDDATA.cookie.expires.toISOString(),
        );
        return done();
      });
    });
    test('Should touch session', (done) => {
      store.touch('1234ABC', TOUCHED, done);
    });
    test('Should get touched session', (done) => {
      store.get('1234ABC', (err: any, session: any) => {
        if (err) return done(err);

        expect(session).toBeTruthy();
        expect(session.cookie.expires).toEqual(
          TOUCHED.cookie.expires.toISOString(),
        );
        return done();
      });
    });
    test('Should remove created session', (done) => {
      store.destroy('1234ABC', done);
    });
    test('Should have no sessions in the database', (done) => {
      store.length((err: any, length: number) => {
        if (err) return done(err);

        expect(length).toBe(0);
        return done();
      });
    });
  });

  describe('autoRemove test suite', () => {
    let cbed = false;
    const cb = () => {
      cbed = true;
    };
    const store = new MSSQLStore(sqlConfig, {
      table: 'Sessions',
      autoRemove: true,
      autoRemoveCallback: cb,
    });

    test('Should destroy all sessions', (done) => {
      /* eslint-disable no-shadow */
      setTimeout(() => {
        store.set(
          'a',
          {
            cookie: {
              expires: new Date(Date.now() - 60000),
            },
          },
          (err: any) => {
            if (err) {
              return done(err);
            }

            return store.set(
              'b',
              {
                cookie: {
                  expires: new Date(Date.now() - 60000),
                },
              },
              (err: any) => {
                if (err) {
                  return done(err);
                }

                return store.length((err: any, length: number) => {
                  if (err) {
                    return done(err);
                  }
                  expect(length).toBe(2);

                  return store.destroyExpired((err: any) => {
                    if (err) {
                      return done(err);
                    }
                    return store.length((err: any, length: number) => {
                      if (err) {
                        return done(err);
                      }

                      expect(length).toBe(0);
                      expect(cbed).toBeTruthy();

                      return done();
                    });
                  });
                });
              },
            );
          },
        );
      }, 1000);
      /* eslint-enable no-shadow */
    });
  });

  describe('errors test suite', () => {
    const store = new MSSQLStore(sqlConfig, {
      table: 'Sessions',
    });
    test('Should wait for connection establishment', (done) => {
      store.get('asdf', done);
    });
    test('Should report error when connection is closed', (done) => {
      store.databaseConnection!.close();
      store.get('asdf', (err: any) => {
        expect(err).toBeTruthy();
        return done();
      });
    });
  });

  describe('emitters test suite', () => {
    test('Should emit a connect listener', (done) => {
      const store = new MSSQLStore(sqlConfig, {
        table: 'Sessions',
      });
      store.get('abcd', (err: any) => err);

      store.on('connect', (connected: any) => {
        // eslint-disable-next-line no-underscore-dangle
        expect(connected.databaseConnection._connected).toBeTruthy();
        return done();
      });
    });
    test('Should emit an error listener', (done) => {
      const localConfig = {
        user: process.env.SQLUSER,
        password: 'noGoodPassword',
        server: process.env.SQLSERVER as string,
        database: process.env.SQLDATABASE as string,
      };
      const store = new MSSQLStore(localConfig, {
        table: 'Sessions',
      });

      store.get('abcd', (err: any) => err);

      store.on('error', (error: any) => {
        expect(error.name).toEqual('ConnectionError');
        expect(error.originalError.message).toEqual(
          expect.stringContaining('Login failed'),
        );
        return done();
      });
    });
  });
});
