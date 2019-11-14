import session from 'express-session';
import sql, { config } from 'mssql';
import * as dotenv from 'dotenv';
import * as path from 'path';
import sessionStore from '../src/store';
const MSSQLStore = sessionStore(session);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const TESTDATA = {
  somevalue: 'yes',
  somenumber: 123,
  cookie: { expires: new Date() }
};
const MODIFIEDDATA = {
  somevalue: 'no',
  somenumber: 456,
  cookie: { expires: new Date() }
};
const TOUCHED = { cookie: { expires: new Date() } };
const sqlConfig: config = {
  user: process.env.SQLUSER,
  password: process.env.SQLPASSWORD,
  server: process.env.SQLSERVER as string,
  database: process.env.SQLDATABASE as string
};

beforeAll(async () => {
  const db = new sql.ConnectionPool(sqlConfig);
  await db.connect();
  const request = db.request();
  await request.query(`DELETE FROM dbo.Sessions`);
  await db.close();
});

describe('connect-mssql-v2', () => {
  const store = new MSSQLStore(sqlConfig, {
    table: 'Sessions',
    autoRemove: true,
    autoRemoveInterval: 1000 * 60 * 60
  });

  test('Should not find a session', done => {
    store.get('1234ABC', (err: any, session: any) => {
      if (err) return done(err);

      expect(session).toBeFalsy();
      done();
    });
  });
  test('Should create a new session', done => {
    store.set('1234ABC', TESTDATA, done);
  });
  test('Should get created session', done => {
    store.get('1234ABC', (err: any, session: any) => {
      if (err) return done(err);

      expect(session).toBeTruthy();
      expect(session.somevalue).toEqual(TESTDATA.somevalue);
      expect(session.somenumber).toEqual(TESTDATA.somenumber);
      expect(session.cookie.expires).toEqual(
        TESTDATA.cookie.expires.toISOString()
      );
      done();
    });
  });
  test('Should modify session', done => {
    store.set('1234ABC', MODIFIEDDATA, done);
  });
  test('Should get modified session', done => {
    store.get('1234ABC', (err: any, session: any) => {
      if (err) return done(err);

      expect(session).toBeTruthy();
      expect(session.somevalue).toEqual(MODIFIEDDATA.somevalue);
      expect(session.somenumber).toEqual(MODIFIEDDATA.somenumber);
      expect(session.cookie.expires).toEqual(
        MODIFIEDDATA.cookie.expires.toISOString()
      );
      done();
    });
  });
  test('Should touch session', done => {
    store.touch('1234ABC', TOUCHED, done);
  });
  test('Should get touched session', done => {
    store.get('1234ABC', (err: any, session: any) => {
      if (err) return done(err);

      expect(session).toBeTruthy();
      expect(session.cookie.expires).toEqual(
        TOUCHED.cookie.expires.toISOString()
      );
      done();
    });
  });
  test('Should remove created session', done => {
    store.destroy('1234ABC', done);
  });
  test('Should have no sessions in the database', done => {
    store.length((err, length) => {
      if (err) return done(err);

      expect(length).toBe(0);
      done();
    });
  });
});
