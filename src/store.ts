/* eslint-disable no-useless-catch */
import sql, {
  config as SQLConfig,
  NVarChar,
  MAX,
  DateTime,
  ConnectionPool,
} from 'mssql';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Store as ExpressSessionStore } from 'express-session';

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
   * Sets the timer interval for each call to `destroyExpired()`. Default: `1000 * 60 * 10` (10 min)
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

export type ReadyCallback = (err?: any, callback?: any) => Promise<any>;

export interface IMSSQLStore {
  config: SQLConfig;
  options?: StoreOptions;
  databaseConnection: ConnectionPool | null;
  get(
    sid: string,
    callback: (err: any, session?: Express.SessionData | null) => void
  ): void;
  set(
    sid: string,
    session: Express.SessionData,
    callback?: (err?: any) => void
  ): void;
  touch(
    sid: string,
    session: Express.SessionData,
    callback?: (err?: any) => void
  ): void;
  destroy(sid: string, callback?: (err?: any) => void): void;
  destroyExpired(callback?: Function): void;
  length(callback?: (err: any, length?: number | null) => void): void;
  clear(callback?: (err?: any) => void): void;
}
type TypeofExpressSessionStoreObject = { Store: TypeofExpressSessionStore };
type TypeofExpressSessionStore = typeof ExpressSessionStore;

const Store = (
  sessionData:
  | TypeofExpressSessionStoreObject
  | { session: TypeofExpressSessionStoreObject },
): any => {
  // **note** this is cast to any due to multiple issues with the express-session types
  // See https://github.com/JLuboff/connect-mssql-v2/issues/10

  const SessionStore: any = (sessionData as TypeofExpressSessionStoreObject).Store
    || (sessionData as { session: TypeofExpressSessionStoreObject }).session.Store;

  class MSSQLStore extends SessionStore implements IMSSQLStore {
    table: string;

    ttl: number;

    autoRemove: boolean;

    autoRemoveInterval: number;

    autoRemoveCallback?: (props?: any) => any;

    useUTC: boolean;

    config: SQLConfig;

    databaseConnection: ConnectionPool;

    constructor(config: SQLConfig, options?: StoreOptions) {
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
      try {
        // Attachs connect event listener and emits on successful connection
        this.databaseConnection.on('connect', () => this.emit('connect', this));
        // Attachs error event listener and emits on failed connection
        this.databaseConnection.on('error', (error) => this.emit('error', error));

        await this.databaseConnection.connect();
        this.databaseConnection.emit('connect');
        if (this.autoRemove) {
          setInterval(
            () => this.destroyExpired(this.autoRemoveCallback),
            this.autoRemoveInterval,
          );
        }
      } catch (error) {
        throw error;
      }
    }

    private async ready(callback: (err?: any, callback?: any) => Promise<any>) {
      try {
        if (
          !this.databaseConnection.connected
          && !this.databaseConnection.connecting
        ) {
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

    errorHandler(method: keyof IMSSQLStore, error: any, callback?: any) {
      // Attachs sessionError event listener and emits on error on any
      // store error and includes method where error occured
      // eslint-disable-next-line no-shadow
      this.databaseConnection.once('sessionError', (error, method) => this.emit('sessionError', error, method));
      this.databaseConnection.emit('sessionError', error, method);
      if (callback) {
        return callback(error);
      }
      return undefined;
    }

    // ////////////////////////////////////////////////////////////////
    // Attempt to fetch session the given sid
    /**
     * @param sid
     * @param callback
     */
    // //////////////////////////////////////////////////////////////
    get(
      sid: string,
      callback: (err: any, session?: Express.SessionData | null) => void,
    ) {
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
    // Commit the given session object associated
    // with the given sid
    /**
     *
     * @param sid
     * @param session
     * @param callback
     */
    // //////////////////////////////////////////////////////////////
    set(
      sid: string,
      session: Express.SessionData,
      callback?: (err?: any) => void,
    ) {
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
    // Update the expiration date of the given sid
    /**
     *
     * @param sid
     * @param data
     * @param callback
     */
    // //////////////////////////////////////////////////////////////
    touch(
      sid: string,
      session: Express.SessionData,
      callback: (err?: any) => void,
    ) {
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
            .input('expires', DateTime, expires).query(`
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
    // Destroy the session associated with the given sid
    /**
     *
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
    // Destroy expired sessions
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
    // Fetch number of sessions
    /**
     * @param callback
     */
    // //////////////////////////////////////////////////////////////
    length(callback: (err: any, length?: number | null) => void) {
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
    // Clear all sessions
    /**
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

export default Store;
