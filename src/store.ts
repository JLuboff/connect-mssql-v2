import sql, {
  config as SQLConfig,
  NVarChar,
  MAX,
  DateTime,
  ConnectionPool
} from 'mssql';
import EventEmitter from 'events';
class SQLEmitter extends EventEmitter {};

interface StoreOptions {
  table?: string;
  ttl?: number;
  autoRemove?: boolean;
  autoRemoveInterval?: number;
  autoRemoveCallback?: any;
  useUTC?: boolean;
}
type Callback = (a?: any, b?: any) => void;
const Store = (session: any) => {
  const Store = session.Store || session.session.Store;
  class MSSQLStore extends Store {
    table: string;
    ttl: number;
    autoRemove: boolean;
    autoRemoveInterval: number;
    autoRemoveCallback?: (error?: Error) => any;
    useUTC: boolean;
    config: SQLConfig;
    private databaseConnection: ConnectionPool | null;

    constructor(config: SQLConfig, options: StoreOptions) {
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
        this.databaseConnection = new sql.ConnectionPool(this.config);
        await this.databaseConnection.connect();
        const emitter = new SQLEmitter();
        emitter.on('connect', this.emit.bind(this, 'connect'));
        emitter.on('error', this.emit.bind(this, 'error'));
        emitter.emit('connect')
        emitter.emit('error')
        if (this.autoRemove) {
          setInterval(this.destroyExpired.bind(this), this.autoRemoveInterval);
        }
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
    private async ready(callback: Callback) {
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
    get(sid: string, callback: Callback) {
      this.ready(async (err: any) => {
        if (err) {
          throw err;
        }

        try {
          const request = (this.databaseConnection as ConnectionPool).request();
          const result = await request.input('sid', NVarChar(255), sid).query(`
              SELECT session FROM ${this.table} WHERE sid = @sid`);

          if (result.recordset.length) {
            return callback(null, JSON.parse(result.recordset[0].session));
          }

          return callback(null, null);
        } catch (error) {
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
    set(sid: string, data: any, callback: Callback) {
      this.ready(async (err: any) => {
        if (err) {
          throw err;
        }

        try {
          const expires = new Date(
            (data.cookie && data.cookie.expires) || Date.now() + this.ttl
          );
          const request = (this.databaseConnection as ConnectionPool).request();
          await request
            .input('sid', NVarChar(255), sid)
            .input('session', NVarChar(MAX), JSON.stringify(data))
            .input('expires', DateTime, expires).query(`
              UPDATE ${this.table} 
                SET session = @session, expires = @expires 
                WHERE sid = @sid;
                IF @@ROWCOUNT = 0 
                  BEGIN
                    INSERT INTO ${this.table} (sid, session, expires)
                      VALUES (@sid, @session, @expires)
                  END;`);

          return callback();
        } catch (error) {
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
    touch(sid: string, data: any, callback: Callback) {
      this.ready(async (err: any) => {
        if (err) {
          throw err;
        }

        try {
          const expires = new Date(
            (data.cookie && data.cookie.expires) || Date.now() + this.ttl
          );
          const request = (this.databaseConnection as ConnectionPool).request();
          await request
            .input('sid', NVarChar(255), sid)
            .input('expires', DateTime, expires).query(`
              UPDATE ${this.table} 
                SET expires = @expires 
              WHERE sid = @sid`);

          return callback();
        } catch (error) {
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
    destroy(sid: string, callback: Callback) {
      this.ready(async (err: any) => {
        if (err) {
          throw err;
        }

        try {
          const request = (this.databaseConnection as ConnectionPool).request();
          await request.input('sid', NVarChar(255), sid).query(`
              DELETE FROM ${this.table} 
              WHERE sid = @sid`);

          return callback();
        } catch (error) {
          return callback(error);
        }
      });
    }
    //////////////////////////////////////////////////////////////////
    // Destroy expired sessions
    ////////////////////////////////////////////////////////////////
    destroyExpired(callback: Callback) {
      this.ready(async (err: any) => {
        if (err) {
          throw err;
        }

        try {
          const request = (this.databaseConnection as ConnectionPool).request();
          await request.query(`
              DELETE FROM ${this.table} 
              WHERE expires <= GET${this.useUTC ? 'UTC' : ''}DATE()`);

          return callback();
        } catch (error) {
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
    length(callback: Callback) {
      this.ready(async (err: any) => {
        if (err) {
          throw err;
        }

        try {
          const request = (this.databaseConnection as ConnectionPool).request();
          const result = await request.query(`
              SELECT COUNT(sid) AS length
              FROM ${this.table}`);

          return callback(null, result.recordset[0].length);
        } catch (error) {
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
    clear(callback: Callback) {
      this.ready(async (err: any) => {
        if (err) {
          throw err;
        }

        try {
          const request = (this.databaseConnection as ConnectionPool).request();
          await request.query(`
              TRUNCATE TABLE ${this.table}`);

          return callback();
        } catch (error) {
          return callback(error);
        }
      });
    }
  }
  return MSSQLStore;
};

export default Store;
