"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mssql_1 = __importStar(require("mssql"));
const Store = (session) => {
    const Store = session.Store || session.session.Store;
    class MSSQLStore extends Store {
        constructor(config, options) {
            super();
            this.table = options.table || 'sessions';
            this.ttl = options.ttl || 1000 * 60 * 60 * 24;
            this.autoRemove = options.autoRemove || false;
            this.autoRemoveInterval = options.autoRemoveInterval || 1000 * 60 * 10;
            this.autoRemoveCallback = options.autoRemoveCallback || undefined;
            this.useUTC = options.useUTC || true;
            this.config = config;
            this.databaseConnection = null;
        }
        async initializeDatabase() {
            try {
                this.databaseConnection = new mssql_1.default.ConnectionPool(this.config);
                await this.databaseConnection.connect();
                if (this.autoRemove) {
                    setInterval(this.destroyExpired.bind(this), this.autoRemoveInterval);
                }
            }
            catch (error) {
                console.error(error);
                throw error;
            }
        }
        async ready(callback) {
            await this.initializeDatabase();
            if (this.databaseConnection && this.databaseConnection.connected) {
                return callback.call(this, null, null);
            }
            if (this.databaseConnection && this.databaseConnection.connecting) {
                return this.databaseConnection.once('connect', callback.bind(this));
            }
            callback.call(this, new Error('Connection is closed.'));
        }
        //////////////////////////////////////////////////////////////////
        // Attempt to fetch session the given sid
        /**
         * @param sid
         * @param callback
         */
        ////////////////////////////////////////////////////////////////
        get(sid, callback) {
            this.ready(async (err) => {
                if (err) {
                    throw err;
                }
                try {
                    const request = this.databaseConnection.request();
                    const result = await request.input('sid', mssql_1.NVarChar(255), sid).query(`
              SELECT session FROM ${this.table} WHERE sid = @sid`);
                    if (result.recordset.length) {
                        return callback(null, JSON.parse(result.recordset[0].session));
                    }
                    return callback(null, null);
                }
                catch (error) {
                    return callback(error);
                }
            });
        }
        //////////////////////////////////////////////////////////////////
        // Commit the given session object associated
        // with the given sid
        /**
         *
         * @param sid
         * @param data
         * @param callback
         */
        ////////////////////////////////////////////////////////////////
        set(sid, data, callback) {
            this.ready(async (err) => {
                if (err) {
                    throw err;
                }
                try {
                    const expires = new Date((data.cookie && data.cookie.expires) || Date.now() + this.ttl);
                    const request = this.databaseConnection.request();
                    await request
                        .input('sid', mssql_1.NVarChar(255), sid)
                        .input('session', mssql_1.NVarChar(mssql_1.MAX), JSON.stringify(data))
                        .input('expires', mssql_1.DateTime, expires).query(`
              UPDATE ${this.table} 
                SET session = @session, expires = @expires 
                WHERE sid = @sid;
                IF @@ROWCOUNT = 0 
                  BEGIN
                    INSERT INTO ${this.table} (sid, session, expires)
                      VALUES (@sid, @session, @expires)
                  END;`);
                    return callback();
                }
                catch (error) {
                    return callback(error);
                }
            });
        }
        //////////////////////////////////////////////////////////////////
        // Update the expiration date of the given sid
        /**
         *
         * @param sid
         * @param data
         * @param callback
         */
        ////////////////////////////////////////////////////////////////
        touch(sid, data, callback) {
            this.ready(async (err) => {
                if (err) {
                    throw err;
                }
                try {
                    const expires = new Date((data.cookie && data.cookie.expires) || Date.now() + this.ttl);
                    const request = this.databaseConnection.request();
                    await request
                        .input('sid', mssql_1.NVarChar(255), sid)
                        .input('expires', mssql_1.DateTime, expires).query(`
              UPDATE ${this.table} 
                SET expires = @expires 
              WHERE sid = @sid`);
                    return callback();
                }
                catch (error) {
                    return callback(error);
                }
            });
        }
        //////////////////////////////////////////////////////////////////
        // Destroy the session associated with the given sid
        /**
         *
         * @param sid
         * @param callback
         */
        ////////////////////////////////////////////////////////////////
        destroy(sid, callback) {
            this.ready(async (err) => {
                if (err) {
                    throw err;
                }
                try {
                    const request = this.databaseConnection.request();
                    await request.input('sid', mssql_1.NVarChar(255), sid).query(`
              DELETE FROM ${this.table} 
              WHERE sid = @sid`);
                    return callback();
                }
                catch (error) {
                    return callback(error);
                }
            });
        }
        //////////////////////////////////////////////////////////////////
        // Destroy expired sessions
        ////////////////////////////////////////////////////////////////
        destroyExpired(callback) {
            this.ready(async (err) => {
                if (err) {
                    throw err;
                }
                try {
                    const request = this.databaseConnection.request();
                    await request.query(`
              DELETE FROM ${this.table} 
              WHERE expires <= GET${this.useUTC ? 'UTC' : ''}DATE()`);
                    return this.autoRemoveCallback
                        ? this.autoRemoveCallback()
                        : callback();
                }
                catch (error) {
                    return this.autoRemoveCallback
                        ? this.autoRemoveCallback(err)
                        : callback(err);
                }
            });
        }
        //////////////////////////////////////////////////////////////////
        // Fetch number of sessions
        /**
         * @param callback
         */
        ////////////////////////////////////////////////////////////////
        length(callback) {
            this.ready(async (err) => {
                if (err) {
                    throw err;
                }
                try {
                    const request = this.databaseConnection.request();
                    const result = await request.query(`
              SELECT COUNT(sid) AS length
              FROM ${this.table}`);
                    return callback(null, result.recordset[0].length);
                }
                catch (error) {
                    return callback(error);
                }
            });
        }
        //////////////////////////////////////////////////////////////////
        // Clear all sessions
        /**
         * @param callback
         */
        ////////////////////////////////////////////////////////////////
        clear(callback) {
            this.ready(async (err) => {
                if (err) {
                    throw err;
                }
                try {
                    const request = this.databaseConnection.request();
                    await request.query(`
              TRUNCATE TABLE ${this.table}`);
                    return callback();
                }
                catch (error) {
                    return callback(error);
                }
            });
        }
    }
    return MSSQLStore;
};
exports.default = Store;
