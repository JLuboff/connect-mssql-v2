/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable no-undef */
const sql = require('mssql');
const dotenv = require('dotenv');
const path = require('path');
const MSSQLStore = require('../src/store');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const sqlConfig = {
  user: process.env.SQLUSER,
  password: process.env.SQLPASSWORD,
  server: process.env.SQLSERVER,
  database: process.env.SQLDATABASE,
  options: { trustServerCertificate: true },
};

beforeAll(async () => {
  const db = new sql.ConnectionPool(sqlConfig);
  await db.connect();
  const request = db.request();
  await request.query('DELETE FROM dbo.Sessions');
  await db.close();
});

describe('connect-mssql-v2 -- JS Require ', () => {
  describe('Basic test suite', () => {
    const store = new MSSQLStore(sqlConfig, {
      table: 'Sessions',
    });

    test('Should not find a session', (done) => {
      store.get('1234ABC', (err, session) => {
        if (err) return done(err);

        expect(session).toBeFalsy();
        return done();
      });
    });
  });
});
