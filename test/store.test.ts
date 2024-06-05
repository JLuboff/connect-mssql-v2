/* eslint-disable @typescript-eslint/no-shadow */
import sql, { config } from 'mssql';
import * as dotenv from 'dotenv';
import * as path from 'path';
import MSSQLStore from '../src/store';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const TESTDATA = {
  somevalue: 'yes',
  somenumber: 123,
  cookie: { expires: new Date(), originalMaxAge: 10000 },
};
const MODIFIEDDATA = {
  somevalue: 'no',
  somenumber: 456,
  cookie: { expires: new Date(), originalMaxAge: 10000 },
};
const TOUCHED = { cookie: { expires: new Date(), originalMaxAge: 10000 } };
const sqlConfig: config = {
  user: process.env.SQLUSER,
  password: process.env.SQLPASSWORD,
  server: process.env.SQLSERVER as string,
  database: process.env.SQLDATABASE as string,
  options: { trustServerCertificate: true },
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
      store.get('1234ABC', (err: unknown, session: any) => {
        if (err) return done(err);

        expect(session).toBeFalsy();
        return done();
      });
    });
    test('Should create a new session', (done) => {
      store.set('1234ABC', TESTDATA, done);
    });
    test('Should get created session', (done) => {
      store.get('1234ABC', (err: unknown, session: any) => {
        if (err) return done(err);

        expect(session).toBeTruthy();
        expect(session.somevalue).toEqual(TESTDATA.somevalue);
        expect(session.somenumber).toEqual(TESTDATA.somenumber);
        expect(session.cookie.expires).toEqual(TESTDATA.cookie.expires.toISOString());
        return done();
      });
    });
    test('Should modify session', (done) => {
      store.set('1234ABC', MODIFIEDDATA, done);
    });
    test('Should get modified session', (done) => {
      store.get('1234ABC', (err: unknown, session: any) => {
        if (err) return done(err);

        expect(session).toBeTruthy();
        expect(session.somevalue).toEqual(MODIFIEDDATA.somevalue);
        expect(session.somenumber).toEqual(MODIFIEDDATA.somenumber);
        expect(session.cookie.expires).toEqual(MODIFIEDDATA.cookie.expires.toISOString());
        return done();
      });
    });
    test('Should touch session', (done) => {
      store.touch('1234ABC', TOUCHED, done);
    });
    test('Should get touched session', (done) => {
      store.get('1234ABC', (err: unknown, session: any) => {
        if (err) return done(err);

        expect(session).toBeTruthy();
        expect(session.cookie.expires).toEqual(TOUCHED.cookie.expires.toISOString());
        return done();
      });
    });
    test('Should get all existing sessions', (done) => {
      store.set('5678DEF', TESTDATA, () => {
        store.all((err: unknown, session: any) => {
          if (err) return done(err);

          expect(Object.keys(session)).toHaveLength(2);
          expect(session['5678DEF'].somevalue).toBe('yes');

          store.destroy('5678DEF');
          return done();
        });
      });
    });
    test('Should remove created session', (done) => {
      store.destroy('1234ABC', done);
    });
    test('Should have no sessions in the database', (done) => {
      store.length((err: unknown, length: number) => {
        if (err) return done(err);

        expect(length).toBe(0);
        return done();
      });
    });

    test('Should add a session than use clear method to remove', (done) => {
      store.set('5678DEF', TESTDATA, () => {
        store.all((err: unknown, session: any) => {
          if (err) return done(err);

          expect(Object.keys(session)).toHaveLength(1);
          expect(session['5678DEF'].somevalue).toBe('yes');

          store.clear((err: unknown) => {
            if (err) return done(err);
            store.all((err: unknown, session: any) => {
              if (err) return done(err);

              expect(session).toBeFalsy();
              return done();
            });

            return done();
          });

          return done();
        });
      });
    });
  });

  describe('Custom column names test suite', () => {
    const store = new MSSQLStore(sqlConfig, {
      table: 'CustomColumnNameSessions',
      columnNames: { session: 'UserSessions', sid: 'SessionID', expires: 'SessionExpiresAt' },
    });

    test('Should not find a session', (done) => {
      store.get('1234ABC', (err: unknown, session: any) => {
        if (err) return done(err);

        expect(session).toBeFalsy();
        return done();
      });
    });
    test('Should create a new session', (done) => {
      store.set('1234ABC', TESTDATA, done);
    });
    test('Should get created session', (done) => {
      store.get('1234ABC', (err: unknown, session: any) => {
        if (err) return done(err);

        expect(session).toBeTruthy();
        expect(session.somevalue).toEqual(TESTDATA.somevalue);
        expect(session.somenumber).toEqual(TESTDATA.somenumber);
        expect(session.cookie.expires).toEqual(TESTDATA.cookie.expires.toISOString());
        return done();
      });
    });
    test('Should modify session', (done) => {
      store.set('1234ABC', MODIFIEDDATA, done);
    });
    test('Should get modified session', (done) => {
      store.get('1234ABC', (err: unknown, session: any) => {
        if (err) return done(err);

        expect(session).toBeTruthy();
        expect(session.somevalue).toEqual(MODIFIEDDATA.somevalue);
        expect(session.somenumber).toEqual(MODIFIEDDATA.somenumber);
        expect(session.cookie.expires).toEqual(MODIFIEDDATA.cookie.expires.toISOString());
        return done();
      });
    });
    test('Should touch session', (done) => {
      store.touch('1234ABC', TOUCHED, done);
    });
    test('Should get touched session', (done) => {
      store.get('1234ABC', (err: unknown, session: any) => {
        if (err) return done(err);

        expect(session).toBeTruthy();
        expect(session.cookie.expires).toEqual(TOUCHED.cookie.expires.toISOString());
        return done();
      });
    });
    test('Should get all existing sessions', (done) => {
      store.set('5678DEF', TESTDATA, () => {
        store.all((err: unknown, session: any) => {
          if (err) return done(err);

          expect(Object.keys(session)).toHaveLength(2);
          expect(session['5678DEF'].somevalue).toBe('yes');

          store.destroy('5678DEF');
          return done();
        });
      });
    });
    test('Should remove created session', (done) => {
      store.destroy('1234ABC', done);
    });
    test('Should have no sessions in the database', (done) => {
      store.length((err: unknown, length: number) => {
        if (err) return done(err);

        expect(length).toBe(0);
        return done();
      });
    });

    test('Should add a session than use clear method to remove', (done) => {
      store.set('5678DEF', TESTDATA, () => {
        store.all((err: unknown, session: any) => {
          if (err) return done(err);

          expect(Object.keys(session)).toHaveLength(1);
          expect(session['5678DEF'].somevalue).toBe('yes');

          store.clear((err: unknown) => {
            if (err) return done(err);
            store.all((err: unknown, session: any) => {
              if (err) return done(err);

              expect(session).toBeFalsy();
              return done();
            });

            return done();
          });

          return done();
        });
      });
    });
  });

  describe('autoRemove test suite', () => {
    test('Should destroy all sessions', (done) => {
      let cbed = false;
      const cb = () => {
        cbed = true;
      };
      const store = new MSSQLStore(sqlConfig, {
        table: 'Sessions',
        autoRemove: true,
        autoRemoveCallback: cb,
      });
      /* eslint-disable no-shadow */
      setTimeout(() => {
        store.set(
          'a',
          {
            cookie: {
              expires: new Date(Date.now() - 60000),
              originalMaxAge: 1000,
            },
          },
          (err: unknown) => {
            if (err) {
              return done(err);
            }

            return store.set(
              'b',
              {
                cookie: {
                  expires: new Date(Date.now() - 60000),
                  originalMaxAge: 1000,
                },
              },
              (err: unknown) => {
                if (err) {
                  return done(err);
                }

                return store.length((err: unknown, length: number) => {
                  if (err) {
                    return done(err);
                  }
                  expect(length).toBe(2);

                  return store.destroyExpired((err: unknown) => {
                    if (err) {
                      return done(err);
                    }
                    return store.length((err: unknown, length: number) => {
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

    test('should call preRemoveCallback before destroying a session', async () => {
      const autoRemoveCallback = jest.fn();
      const preRemoveCallback = jest.fn();
      const store = new MSSQLStore(sqlConfig, {
        table: 'Sessions',
        autoRemove: true,
        preRemoveCallback,
        autoRemoveCallback,
      });
      // delay execution for 1 second, just like the previous test.
      await new Promise((resolve) => {
        setTimeout(resolve, 1000);
      });

      await store.set('a', {
        cookie: {
          expires: new Date(Date.now() - 60000),
          originalMaxAge: 1000,
        },
      });
      await store.set('b', {
        cookie: {
          expires: new Date(Date.now() - 60000),
          originalMaxAge: 1000,
        },
      });

      // this returns a promise, but not the length
      const length = await new Promise((resolve, reject) => {
        store.length((err: unknown, length: number) => {
          if (err) return reject(err);
          return resolve(length);
        });
      });

      expect(length).toBe(2);

      await new Promise<void>((resolve, reject) => {
        store.destroyExpired((err: unknown) => {
          expect(preRemoveCallback).toHaveBeenCalledTimes(1);
          if (err) return reject(err);
          return resolve();
        });
      });

      const lengthAfter = await new Promise((resolve, reject) => {
        store.length((err: unknown, length: number) => {
          if (err) return reject(err);
          return resolve(length);
        });
      });

      expect(lengthAfter).toBe(0);

      expect(autoRemoveCallback).toHaveBeenCalledTimes(1);
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
      store.get('asdf', (err: unknown) => {
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
      store.get('abcd', (err: unknown) => err);

      store.on('connect', (connected: any) => {
        // eslint-disable-next-line no-underscore-dangle
        expect(connected.databaseConnection._connected).toBeTruthy();
        return done();
      });
    });

    describe('sessionError Listener', () => {
      test('Should emit sessionError (errorHandler called directly)', (done) => {
        const store = new MSSQLStore(sqlConfig, {
          table: 'Sessions',
        });

        store.on('sessionError', (error: unknown, method: string) => {
          expect(method).toEqual('test');
          expect(error).toBeInstanceOf(Error);

          done();
        });

        const errorHandler = store.errorHandler(
          'test' as any,
          new Error('Test errorHandler'),
          () => true,
        );

        expect(errorHandler).toBeTruthy();
      });

      test('Should emit sessionError (errorHandler called directly, NO CB)', (done) => {
        const store = new MSSQLStore(sqlConfig, {
          table: 'Sessions',
        });

        store.on('sessionError', (error: unknown, method: string) => {
          expect(method).toEqual('test');
          expect(error).toBeInstanceOf(Error);

          done();
        });

        const errorHandler = store.errorHandler('test' as any, new Error('Test errorHandler'));

        expect(errorHandler).toBeFalsy();
      });
    });

    test('Should emit an error listener', (done) => {
      const localConfig: config = {
        user: process.env.SQLUSER,
        password: 'noGoodPassword',
        server: process.env.SQLSERVER as string,
        database: process.env.SQLDATABASE as string,
        options: { trustServerCertificate: true },
      };
      const store = new MSSQLStore(localConfig, {
        table: 'Sessions',
      });

      store.get('abcd', (err: unknown) => err);

      store.on('error', (error: unknown) => {
        if (error instanceof Error) {
          expect(error.name).toEqual('ConnectionError');
          expect(error.message).toContain('Login failed');
        }

        expect.assertions(2);

        return done();
      });
    });
  });
});
