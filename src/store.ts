import sql, {
  config as SQLConfig, NVarChar, MAX, DateTime, ConnectionPool,
} from 'mssql';
import { SessionData, Store as ExpressSessionStore } from 'express-session';

const ConnectMSSQLV2 = (
  connect: { Store: ExpressSessionStore } | { session: { Store: ExpressSessionStore } },
): ExpressSessionStore => {
  const Store = (connect as any).Store || (connect as any).session.Store;
  class MSSQLStore extends Store {
    table: string;

    ttl: number;

    autoRemove: boolean;

    autoRemoveInterval: number;

    autoRemoveCallback?: (props?: any) => any;

    useUTC: boolean;

    config: SQLConfig;

    databaseConnection: ConnectionPool;

    constructor(config: SQLConfig, options?: ConnectMSSQLV2.StoreOptions) {
      super();
      this.table = options?.table || 'sessions';
      this.ttl = options?.ttl || 1000 * 60 * 60 * 24;
      this.autoRemove = options?.autoRemove || false;
      this.autoRemoveInterval = options?.autoRemoveInterval || 1000 * 60 * 10;
      this.autoRemoveCallback = options?.autoRemoveCallback || undefined;
      this.useUTC = options?.useUTC || true;
      this.config = config;
      this.databaseConnection = new sql.ConnectionPool(config);
    }

    private async initializeDatabase() {
      // Attachs connect event listener and emits on successful connection
      this.databaseConnection.on('connect', () => this.emit('connect', this));
      // Attachs error event listener and emits on failed connection
      this.databaseConnection.on('error', (error) => this.emit('error', error));

      await this.databaseConnection.connect();
      this.databaseConnection.emit('connect');
      if (this.autoRemove) {
        setInterval(() => this.destroyExpired(this.autoRemoveCallback), this.autoRemoveInterval);
      }
    }

    private async ready(callback: (err?: any, callback?: any) => Promise<any>) {
      try {
        if (!this.databaseConnection.connected && !this.databaseConnection.connecting) {
          await this.initializeDatabase();
        }
        if (this.databaseConnection?.connected) {
          return callback(null, null);
        }
        if (this.databaseConnection?.connecting) {
          return this.databaseConnection.once('connect', callback.bind(this));
        }
        throw new Error('Connection is closed.');
      } catch (error) {
        if (callback) {
          callback(error);
        }
        return this.databaseConnection!.emit('error', error);
      }
    }

    errorHandler(method: keyof MSSQLStore, error: any, callback?: any) {
      // Attachs sessionError event listener and emits on error on any
      // store error and includes method where error occured
      // eslint-disable-next-line no-shadow
      this.databaseConnection.once('sessionError', () => this.emit('sessionError', error, method));
      this.databaseConnection.emit('sessionError', error, method);
      if (callback) {
        return callback(error);
      }
      return undefined;
    }

    // ////////////////////////////////////////////////////////////////
    /**
     * Attempt to fetch all sessions
     * @param callback
     */
    // //////////////////////////////////////////////////////////////
    all(callback: (err: any, session?: { [sid: string]: SessionData } | null) => void) {
      this.ready(async (error: any) => {
        if (error) {
          throw error;
        }

        try {
          const request = (this.databaseConnection as ConnectionPool).request();
          const result: {
            recordset: { sid: string; session: any }[];
          } = await request.query(`
              SELECT sid, session FROM ${this.table}`);

          if (result.recordset.length) {
            const returnObject: { [sid: string]: SessionData } = {};
            for (let i = 0; i < result.recordset.length; i += 1) {
              returnObject[result.recordset[i].sid] = JSON.parse(result.recordset[i].session);
            }

            return callback(null, returnObject);
          }

          return callback(null, null);
        } catch (err) {
          return this.errorHandler('all', err, callback);
        }
      });
    }

    // ////////////////////////////////////////////////////////////////
    /**
     * Attempt to fetch session the given sid
     * @param sid
     * @param callback
     */
    // //////////////////////////////////////////////////////////////
    get(sid: string, callback: (err: any, session?: SessionData | null) => void) {
      this.ready(async (error: any) => {
        if (error) {
          throw error;
        }

        try {
          const request = (this.databaseConnection as ConnectionPool).request();
          const result = await request.input('sid', NVarChar(255), sid).query(`
              SELECT session FROM ${this.table} WHERE sid = @sid`);

          if (result.recordset.length) {
            return callback(null, JSON.parse(result.recordset[0].session));
          }

          return callback(null, null);
        } catch (err) {
          return this.errorHandler('get', err, callback);
        }
      });
    }

    // ////////////////////////////////////////////////////////////////
    /**
     * Commit the given session object associated with the given sid
     * @param sid
     * @param session
     * @param callback
     */
    // //////////////////////////////////////////////////////////////
    set(sid: string, session: SessionData, callback?: (err?: any) => void) {
      this.ready(async (error: any) => {
        if (error) {
          throw error;
        }

        try {
          // Verify session.cookie.expires is not a boolean
          // If so, use current time along with ttl else
          // cast session.cookie.expires to Date to avoid TS error
          const isExpireBoolean = !!session.cookie && typeof session.cookie.expires === 'boolean';
          const expires = new Date(
            isExpireBoolean || !session.cookie?.expires
              ? Date.now() + this.ttl
              : (session.cookie.expires as Date),
          );
          const request = (this.databaseConnection as ConnectionPool).request();
          await request
            .input('sid', NVarChar(255), sid)
            .input('session', NVarChar(MAX), JSON.stringify(session))
            .input('expires', DateTime, expires).query(`
              UPDATE ${this.table} 
                SET session = @session, expires = @expires 
                WHERE sid = @sid;
                IF @@ROWCOUNT = 0 
                  BEGIN
                    INSERT INTO ${this.table} (sid, session, expires)
                      VALUES (@sid, @session, @expires)
                  END;`);

          if (callback) {
            return callback();
          }
          return null;
        } catch (err) {
          return this.errorHandler('set', err, callback);
        }
      });
    }

    // ////////////////////////////////////////////////////////////////
    /**
     * Update the expiration date of the given sid
     * @param sid
     * @param data
     * @param callback
     */
    // //////////////////////////////////////////////////////////////
    touch(sid: string, session: SessionData, callback: (err?: any) => void) {
      this.ready(async (error: any) => {
        if (error) {
          throw error;
        }

        try {
          // Verify session.cookie.expires is not a boolean
          // If so, use current time along with ttl else
          // cast session.cookie.expires to Date to avoid TS error
          const isExpireBoolean = !!session.cookie && typeof session.cookie.expires === 'boolean';
          const expires = new Date(
            isExpireBoolean || !session.cookie?.expires
              ? Date.now() + this.ttl
              : (session.cookie.expires as Date),
          );
          const request = (this.databaseConnection as ConnectionPool).request();
          await request.input('sid', NVarChar(255), sid).input('expires', DateTime, expires).query(`
              UPDATE ${this.table} 
                SET expires = @expires 
              WHERE sid = @sid`);

          if (callback) {
            return callback();
          }
          return null;
        } catch (err) {
          return this.errorHandler('touch', err, callback);
        }
      });
    }

    // ////////////////////////////////////////////////////////////////
    /**
     * Destroy the session associated with the given sid
     * @param sid
     * @param callback
     */
    // //////////////////////////////////////////////////////////////
    destroy(sid: string, callback: (err?: any) => void) {
      this.ready(async (error: any) => {
        if (error) {
          throw error;
        }

        try {
          const request = (this.databaseConnection as ConnectionPool).request();
          await request.input('sid', NVarChar(255), sid).query(`
              DELETE FROM ${this.table} 
              WHERE sid = @sid`);

          if (callback) {
            return callback();
          }
          return null;
        } catch (err) {
          return this.errorHandler('destroy', err, callback);
        }
      });
    }

    // ////////////////////////////////////////////////////////////////
    /**
     * Destroy expired sessions
     * @param callback
     */
    // //////////////////////////////////////////////////////////////
    destroyExpired(callback: any) {
      this.ready(async (error: any) => {
        if (error) {
          throw error;
        }

        try {
          const request = (this.databaseConnection as ConnectionPool).request();
          await request.query(`
              DELETE FROM ${this.table} 
              WHERE expires <= GET${this.useUTC ? 'UTC' : ''}DATE()`);

          if (this.autoRemoveCallback) {
            this.autoRemoveCallback();
          }
          if (callback) {
            return callback();
          }
          return null;
        } catch (err) {
          if (this.autoRemoveCallback) {
            this.autoRemoveCallback(err);
          }
          return this.errorHandler('destroyExpired', err, callback);
        }
      });
    }

    // ////////////////////////////////////////////////////////////////
    /**
     * Fetch total number of sessions
     * @param callback
     */
    // //////////////////////////////////////////////////////////////
    length(callback: (err: any, length: number) => void) {
      this.ready(async (error: any) => {
        if (error) {
          throw error;
        }

        try {
          const request = (this.databaseConnection as ConnectionPool).request();
          const result = await request.query(`
              SELECT COUNT(sid) AS length
              FROM ${this.table}`);

          return callback(null, result.recordset[0].length);
        } catch (err) {
          return this.errorHandler('length', err, callback);
        }
      });
    }

    // ////////////////////////////////////////////////////////////////
    /**
     * Clear all sessions
     * @param callback
     */
    // //////////////////////////////////////////////////////////////
    clear(callback: (err?: any) => void) {
      this.ready(async (error: any) => {
        if (error) {
          throw error;
        }

        try {
          const request = (this.databaseConnection as ConnectionPool).request();
          await request.query(`
              TRUNCATE TABLE ${this.table}`);

          if (callback) {
            return callback();
          }
          return null;
        } catch (err) {
          return this.errorHandler('clear', err, callback);
        }
      });
    }
  }
  return MSSQLStore;
};

export = ConnectMSSQLV2;

namespace ConnectMSSQLV2 {
  export interface StoreOptions {
    /**
     * Table to use as session store. Default: `[sessions]`
     */
    table?: string;
    /**
     * (Time To Live) Determines the expiration date. Default: `1000 * 60 * 60 * 24` (24 hours)
     */
    ttl?: number;
    /**
     * Determines if expired sessions should be autoremoved or not.
     * If value is `true` then a new function, `destroyExpired()`,
     * will autodelete expired sessions on a set interval. Default: `false`
     */
    autoRemove?: boolean;
    /**
     * Sets the timer interval for each call to `destroyExpired()`.
     * Default: `1000 * 60 * 10` (10 min)
     */
    autoRemoveInterval?: number;
    /**
     * Is the callback function for `destroyExpired()`. Default: `undefined`
     */
    autoRemoveCallback?: (props: any) => any;
    /**
     * Determines if we are to use the `GETUTCDATE` instead of `GETDATE` Default: `true`
     */
    useUTC?: boolean;
  }

  // export type ReadyCallback = (err?: any, callback?: any) => Promise<any>;

  // export interface IMSSQLStore {
  //   config: SQLConfig;
  //   options?: StoreOptions;
  //   databaseConnection: ConnectionPool | null;
  //   all(callback: (err: any, session?: { [sid: string]: SessionData } | null) => void): void;
  //   get(sid: string, callback: (err: any, session?: SessionData | null) => void): void;
  //   set(sid: string, session: SessionData, callback?: (err?: any) => void): void;
  //   touch(sid: string, session: SessionData, callback?: (err?: any) => void): void;
  //   destroy(sid: string, callback?: (err?: any) => void): void;
  //   destroyExpired(callback?: Function): void;
  //   length(callback?: (err: any, length?: number | null) => void): void;
  //   clear(callback?: (err?: any) => void): void;
  // }
  // export type TypeofExpressSessionStoreObject = {
  //   Store: TypeofExpressSessionStore;
  // };
  // export type TypeofExpressSessionStore = typeof ExpressSessionStore;
}
