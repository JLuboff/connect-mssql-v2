import sql, {
  config as SQLConfig,
  NVarChar,
  MAX,
  DateTime,
  ConnectionPool,
  ISqlTypeWithLength,
  IResult,
  IRecordSet,
  ISqlTypeFactoryWithNoParams,
} from 'mssql';
import session, { SessionData, Store as ExpressSessionStore } from 'express-session';

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
export interface MSSQLStoreDef {
  config: SQLConfig;
  options?: StoreOptions;
  databaseConnection: ConnectionPool | null;
  all(callback: (err: any, session?: { [sid: string]: SessionData } | null) => void): void;
  get(sid: string, callback: (err: any, session?: SessionData | null) => void): void;
  set(sid: string, currentSession: SessionData, callback?: (err?: any) => void): void;
  touch(sid: string, currentSession: SessionData, callback?: (err?: any) => void): void;
  destroy(sid: string, callback?: (err?: any) => void): void;
  destroyExpired(callback?: Function): void;
  length(callback: (err: any, length?: number | null) => void): void;
  clear(callback?: (err?: any) => void): void;
}
/**
 * ! DEPRECATION WARNING
 * ! This will be deprecated in v4.0 in favor of MSSQLStoreDef
 */
export interface IMSSQLStore extends MSSQLStoreDef {}
type SQLDataTypes = ISqlTypeWithLength | ISqlTypeFactoryWithNoParams;
interface QueryRunnerProps {
  inputParameters?: {
    [key: string]: {
      value: string | Date;
      dataType: SQLDataTypes;
    };
  }[];
  expectReturn: boolean;
  queryStatement: string;
}
class MSSQLStore extends ExpressSessionStore implements MSSQLStoreDef, IMSSQLStore {
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

  private async dbReadyCheck() {
    try {
      if (!this.databaseConnection.connected && !this.databaseConnection.connecting) {
        await this.initializeDatabase();
      }

      if (this.databaseConnection?.connected) {
        return true;
      }

      throw new Error('Connection is closed.');
    } catch (error) {
      this.databaseConnection!.emit('error', error);
      throw error;
    }
  }

  // ////////////////////////////////////////////////////////////////
  /**
   * Verify session.cookie.expires is not a boolean. If so, use current time along with
   * ttl else return session.cookie.expires
   * @param sessionCookie
   */
  // ////////////////////////////////////////////////////////////////
  private getExpirationDate(sessionCookie: session.Cookie) {
    const isExpireBoolean = !!sessionCookie && typeof sessionCookie.expires === 'boolean';
    const expires = new Date(
      isExpireBoolean || !sessionCookie?.expires ? Date.now() + this.ttl : sessionCookie.expires,
    );

    return expires;
  }

  // ////////////////////////////////////////////////////////////////
  /**
   * Runs the provided query statement against the database.
   * Returns T if expectReturn is true else returns null
   * @param props
   */
  // ////////////////////////////////////////////////////////////////
  private async queryRunner<T>(props: QueryRunnerProps): Promise<IRecordSet<T> | null> {
    const isReady = await this.dbReadyCheck();
    if (!isReady) {
      throw new Error('Database connection is closed');
    }
    const request = await this.databaseConnection.request();
    const { inputParameters, expectReturn, queryStatement } = props;
    /**
     * If any inputParamters exist, attach to request object
     */
    inputParameters?.forEach((parameter) => {
      const [key, { value, dataType }] = Object.entries(parameter)[0];
      request.input(key, dataType, value);
    });
    /**
     * Run query against database
     */
    const result: IResult<T> = await request.query(queryStatement);

    return expectReturn ? result.recordset : null;
  }

  // ////////////////////////////////////////////////////////////////
  /**
   * Attachs sessionError event listener and emits on error on any
   * store error and includes method where error occured
   * @param method
   * @param error
   * @param callback
   */
  // ////////////////////////////////////////////////////////////////
  errorHandler(method: keyof MSSQLStoreDef, error: any, callback?: any) {
    // eslint-disable-next-line no-shadow
    this.databaseConnection.once('sessionError', () => this.emit('sessionError', error, method));
    this.databaseConnection.emit('sessionError', error, method);

    return callback ? callback(error) : null;
  }

  // ////////////////////////////////////////////////////////////////
  /**
   * Attempt to fetch all sessions
   * @param callback
   */
  // //////////////////////////////////////////////////////////////
  async all(callback: (err: any, session?: { [sid: string]: SessionData } | null) => void) {
    try {
      const queryResult = await this.queryRunner<{ sid: string; session: string }>({
        queryStatement: `SELECT sid, session FROM ${this.table}`,
        expectReturn: true,
      });
      const queryResultLength = queryResult?.length ?? 0;
      const returnObject: { [sid: string]: SessionData } = {};

      if (queryResult) {
        for (let i = 0; i < queryResultLength; i += 1) {
          returnObject[queryResult[i].sid] = JSON.parse(queryResult[i].session);
        }
      }

      return callback(null, queryResultLength ? returnObject : null);
    } catch (err) {
      return this.errorHandler('all', err, callback);
    }
  }

  // ////////////////////////////////////////////////////////////////
  /**
   * Attempt to fetch session the given sid
   * @param sid
   * @param callback
   */
  // //////////////////////////////////////////////////////////////
  async get(sid: string, callback: (err: any, session?: SessionData | null) => void) {
    try {
      const queryResult = await this.queryRunner<{ session: string }>({
        inputParameters: [{ sid: { value: sid, dataType: NVarChar(255) } }],
        queryStatement: `SELECT session 
                           FROM ${this.table}
                           WHERE sid = @sid`,
        expectReturn: true,
      });

      return callback(null, queryResult?.length ? JSON.parse(queryResult[0].session) : null);
    } catch (err) {
      return this.errorHandler('get', err, callback);
    }
  }

  // ////////////////////////////////////////////////////////////////
  /**
   * Commit the given session object associated with the given sid
   * @param sid
   * @param currentSession
   * @param callback
   */
  // //////////////////////////////////////////////////////////////
  async set(sid: string, currentSession: SessionData, callback?: (err?: any) => void) {
    try {
      const expires = this.getExpirationDate(currentSession.cookie);
      await this.queryRunner({
        inputParameters: [
          { sid: { value: sid, dataType: NVarChar(255) } },
          { session: { value: JSON.stringify(currentSession), dataType: NVarChar(MAX) } },
          { expires: { value: expires, dataType: DateTime } },
        ],
        queryStatement: `UPDATE ${this.table} 
                           SET session = @session, expires = @expires 
                           WHERE sid = @sid;
                           IF @@ROWCOUNT = 0 
                            BEGIN
                              INSERT INTO ${this.table} (sid, session, expires)
                                VALUES (@sid, @session, @expires)
                            END;`,
        expectReturn: false,
      });

      return callback ? callback() : null;
    } catch (err) {
      return this.errorHandler('set', err, callback);
    }
  }

  // ////////////////////////////////////////////////////////////////
  /**
   * Update the expiration date of the given sid
   * @param sid
   * @param data
   * @param callback
   */
  // //////////////////////////////////////////////////////////////
  async touch(sid: string, currentSession: SessionData, callback: (err?: any) => void) {
    try {
      const expires = this.getExpirationDate(currentSession.cookie);
      await this.queryRunner({
        inputParameters: [
          { sid: { value: sid, dataType: NVarChar(255) } },
          { expires: { value: expires, dataType: DateTime } },
        ],
        queryStatement: `UPDATE ${this.table} 
                           SET expires = @expires 
                           WHERE sid = @sid`,
        expectReturn: false,
      });

      return callback ? callback() : null;
    } catch (err) {
      return this.errorHandler('touch', err, callback);
    }
  }

  // ////////////////////////////////////////////////////////////////
  /**
   * Destroy the session associated with the given sid
   * @param sid
   * @param callback
   */
  // //////////////////////////////////////////////////////////////
  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      await this.queryRunner({
        inputParameters: [{ sid: { value: sid, dataType: NVarChar(255) } }],
        queryStatement: `DELETE FROM ${this.table} 
                           WHERE sid = @sid`,
        expectReturn: false,
      });

      return callback ? callback() : null;
    } catch (err) {
      return this.errorHandler('destroy', err, callback);
    }
  }

  // ////////////////////////////////////////////////////////////////
  /**
   * Destroy expired sessions
   * @param callback
   */
  // //////////////////////////////////////////////////////////////
  async destroyExpired(callback: any) {
    try {
      await this.queryRunner({
        queryStatement: `DELETE FROM ${this.table} 
                           WHERE expires <= GET${this.useUTC ? 'UTC' : ''}DATE()`,
        expectReturn: false,
      });

      if (this.autoRemoveCallback) {
        this.autoRemoveCallback();
      }

      return callback ? callback() : null;
    } catch (err) {
      if (this.autoRemoveCallback) {
        this.autoRemoveCallback(err);
      }
      return this.errorHandler('destroyExpired', err, callback);
    }
  }

  // ////////////////////////////////////////////////////////////////
  /**
   * Fetch total number of sessions
   * @param callback
   */
  // //////////////////////////////////////////////////////////////
  async length(callback: (err: any, length: number) => void) {
    try {
      const queryResult = await this.queryRunner<{ length: number }>({
        queryStatement: `SELECT COUNT(sid) AS length
                           FROM ${this.table}`,
        expectReturn: true,
      });

      return callback(null, queryResult?.[0].length ?? 0);
    } catch (err) {
      return this.errorHandler('length', err, callback);
    }
  }

  // ////////////////////////////////////////////////////////////////
  /**
   * Clear all sessions
   * @param callback
   */
  // //////////////////////////////////////////////////////////////
  async clear(callback: (err?: any) => void) {
    try {
      await this.queryRunner({
        queryStatement: `TRUNCATE TABLE ${this.table}`,
        expectReturn: false,
      });

      return callback ? callback() : null;
    } catch (err) {
      return this.errorHandler('clear', err, callback);
    }
  }
}
/**
 * 08/30/2021 - JL
 * * To correct an issue where you could not correctly require within a JS file without
 * * targeting the default export, we have added the line below. Should provide non-breaking fix.
 * * Might be modified for future versions with potential breaking change.
 */
module.exports = MSSQLStore;
export default MSSQLStore;
