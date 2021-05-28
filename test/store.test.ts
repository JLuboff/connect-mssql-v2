/* eslint-disable @typescript-eslint/no-shadow */
import sql, { config, ConnectionPool } from 'mssql';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { SessionData } from 'express-session';
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
        expect(session.cookie.expires).toEqual(TESTDATA.cookie.expires.toISOString());
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
        expect(session.cookie.expires).toEqual(MODIFIEDDATA.cookie.expires.toISOString());
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
        expect(session.cookie.expires).toEqual(TOUCHED.cookie.expires.toISOString());
        return done();
      });
    });
    test('Should get all existing sessions', async (done) => {
      await store.set('5678DEF', TESTDATA, done);

      store.all((err: any, session: any) => {
        if (err) return done(err);

        expect(Object.keys(session)).toHaveLength(2);
        expect(session['5678DEF'].somevalue).toBe('yes');

        store.destroy('5678DEF');
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
    test('Should clear all sessions', async (done) => {
      await store.set('5678DEF', TESTDATA, done);
      await store.set('GHI9876', TESTDATA, done);
      await store.set('JKLMN23', TESTDATA, done);
      /**
       * Verify session records prior to clearing all
       */
      store.all(async (err: any, session: any) => {
        if (err) return done(err);

        expect(Object.keys(session)).toHaveLength(3);

        return store.clear((err) => {
          if (err) return done(err);

          return store.all((err: any, session: any) => {
            if (err) return done(err);

            expect(session).toBeNull();

            return done();
          });
        });
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
              originalMaxAge: 1000,
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
                  originalMaxAge: 1000,
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

    describe('sessionError Listener', () => {
      test('Should emit sessionError (errorHandler called directly)', (done) => {
        const store = new MSSQLStore(sqlConfig, {
          table: 'Sessions',
        });

        store.on('sessionError', (error: any, method: string) => {
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

        store.on('sessionError', (error: any, method: string) => {
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

      store.get('abcd', (err: any) => err);

      store.on('error', (error: any) => {
        expect(error.name).toEqual('ConnectionError');
        expect(error.originalError.message).toEqual(expect.stringContaining('Login failed'));
        return done();
      });
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

    class TestStore extends MSSQLStore {
      // eslint-disable-next-line consistent-return
      async ready(callback: (err?: any, callback?: any) => Promise<any>) {
        try {
          throw new Error('Test error');
        } catch (error) {
          if (callback) {
            callback(error);
          }
          return this.databaseConnection!.emit('error', error);
        }
      }
    }

    const testStore = new TestStore(sqlConfig, { table: 'Sessions' });
    testStore.on('sessionError', (method, error) => {
      console.log(method, error);
    });
    testStore.on('error', (error) => {
      console.log(error);
    });
    test('Should throw an error when running method: all', async (done) => {
      try {
        await testStore.all((err: any) => {
          if (err) throw err;

          return done();
        });
      } catch (error) {
        expect(error).not.toBeNull();
        expect(error.message).toContain('Test error');
        return done();
      }
    });
    test('Should throw an error when running method: set', (done) => {
      testStore.set('1234ABC', TESTDATA, (err: any) => {
        expect(err).not.toBeNull();
        expect(err.message).toBe('Test error');
        return done();
      });
    });

    test('Should throw an error when running method: touch', (done) => {
      testStore.touch('1234ABC', TOUCHED, (err: any) => {
        expect(err).not.toBeNull();
        expect(err.message).toBe('Test error');
        return done();
      });
    });
    test('Should throw an error when running method: destroy', (done) => {
      testStore.destroy('1234ABC', (err: any) => {
        expect(err).not.toBeNull();
        expect(err.message).toBe('Test error');
        return done();
      });
    });
    test('Should throw an error when running method: destroyExpired', (done) => {
      testStore.destroyExpired((err: any) => {
        expect(err).not.toBeNull();
        expect(err.message).toBe('Test error');
        return done();
      });
    });

    test('Should throw an error when running method: length', (done) => {
      testStore.length((err: any) => {
        expect(err).not.toBeNull();
        expect(err.message).toBe('Test error');
        return done();
      });
    });
    test('Should throw an error when running method: clear', (done) => {
      testStore.clear((err: any) => {
        expect(err).not.toBeNull();
        expect(err.message).toBe('Test error');
        return done();
      });
    });
  });
});
