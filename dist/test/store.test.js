"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_session_1 = __importDefault(require("express-session"));
const mssql_1 = __importDefault(require("mssql"));
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const store_1 = __importDefault(require("../src/store"));
const MSSQLStore = store_1.default(express_session_1.default);
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
const sqlConfig = {
    user: process.env.SQLUSER,
    password: process.env.SQLPASSWORD,
    server: process.env.SQLSERVER,
    database: process.env.SQLDATABASE
};
beforeAll(async () => {
    const db = new mssql_1.default.ConnectionPool(sqlConfig);
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
        store.get('1234ABC', (err, session) => {
            if (err)
                return done(err);
            expect(session).toBeFalsy();
            done();
        });
    });
    test('Should create a new session', done => {
        store.set('1234ABC', TESTDATA, done);
    });
    test('Should get created session', done => {
        store.get('1234ABC', (err, session) => {
            if (err)
                return done(err);
            expect(session).toBeTruthy();
            expect(session.somevalue).toEqual(TESTDATA.somevalue);
            expect(session.somenumber).toEqual(TESTDATA.somenumber);
            expect(session.cookie.expires).toEqual(TESTDATA.cookie.expires.toISOString());
            done();
        });
    });
    test('Should modify session', done => {
        store.set('1234ABC', MODIFIEDDATA, done);
    });
    test('Should get modified session', done => {
        store.get('1234ABC', (err, session) => {
            if (err)
                return done(err);
            expect(session).toBeTruthy();
            expect(session.somevalue).toEqual(MODIFIEDDATA.somevalue);
            expect(session.somenumber).toEqual(MODIFIEDDATA.somenumber);
            expect(session.cookie.expires).toEqual(MODIFIEDDATA.cookie.expires.toISOString());
            done();
        });
    });
    test('Should touch session', done => {
        store.touch('1234ABC', TOUCHED, done);
    });
    test('Should get touched session', done => {
        store.get('1234ABC', (err, session) => {
            if (err)
                return done(err);
            expect(session).toBeTruthy();
            expect(session.cookie.expires).toEqual(TOUCHED.cookie.expires.toISOString());
            done();
        });
    });
    test('Should remove created session', done => {
        store.destroy('1234ABC', done);
    });
    test('Should have no sessions in the database', done => {
        store.length((err, length) => {
            if (err)
                return done(err);
            expect(length).toBe(0);
            done();
        });
    });
});
