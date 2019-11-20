import sql, {
  config as SQLConfig,
  NVarChar,
  MAX,
  DateTime,
  ConnectionPool,
  ConnectionError
} from 'mssql';
import {
  StoreOptions,
  IMSSQLStore,
  ReadyCallback,
  GetCallback,
  Errors,
  CommonCallback,
  LengthCallback
} from './index';

const Store = (session: any) => {
  const Store = session.Store || session.session.Store;
  return class MSSQLStore extends Store implements IMSSQLStore {
    table: string;
    ttl: number;
    autoRemove: boolean;
    autoRemoveInterval: number;
    autoRemoveCallback?: (props?: any) => any;
    useUTC: boolean;
    config: SQLConfig;
    databaseConnection: ConnectionPool | null;

    constructor(config: SQLConfig, options?: StoreOptions) {
      super();
      this.table = (options && options.table) || 'sessions';
      this.ttl = (options && options.ttl) || 1000 * 60 * 60 * 24;
      this.autoRemove = (options && options.autoRemove) || false;
      this.autoRemoveInterval =
        (options && options.autoRemoveInterval) || 1000 * 60 * 10;
      this.autoRemoveCallback =
        (options && options.autoRemoveCallback) || undefined;
      this.useUTC = (options && options.useUTC) || true;
      this.config = config;
      this.databaseConnection = null;
    }

    async initializeDatabase() {
      try {
        this.databaseConnection = new sql.ConnectionPool(this.config);
        this.databaseConnection.on('connect', () => this.emit('connect', this));
        this.databaseConnection.on('error', error => this.emit('error', error));
        await this.databaseConnection.connect();
        this.databaseConnection.emit('connect');
        if (this.autoRemove) {
          setInterval(this.destroyExpired.bind(this), this.autoRemoveInterval);
        }
      } catch (error) {
        throw error;
      }
    }

    private async ready(callback: ReadyCallback) {
      try {
        await this.initializeDatabase();
        if (this.databaseConnection && this.databaseConnection.connected) {
          return callback.call(this, null, null);
        }
        if (this.databaseConnection && this.databaseConnection.connecting) {
          return this.databaseConnection.once('connect', callback.bind(this));
        }
        throw new Error('Connection is closed.') as ConnectionError;
      } catch (error) {
        this.databaseConnection!.emit('error', error);
        return callback.call(this, error);
      }
    }
    //////////////////////////////////////////////////////////////////
    // Attempt to fetch session the given sid
    /**
     * @param sid
     * @param callback
     */
    ////////////////////////////////////////////////////////////////
    get(sid: string, callback: GetCallback) {
      this.ready(async (error: Errors) => {
        if (error) {
          return callback(error);
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
    set(sid: string, data: any, callback: CommonCallback) {
      this.ready(async (error: Errors) => {
        if (error) {
          return callback(error);
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
    touch(
      sid: string,
      data: { cookie: { expires: Date } },
      callback: CommonCallback
    ) {
      this.ready(async (error: Errors) => {
        if (error) {
          return callback(error);
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
    destroy(sid: string, callback: CommonCallback) {
      this.ready(async (error: Errors) => {
        if (error) {
          return callback(error);
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
    destroyExpired(callback: CommonCallback) {
      this.ready(async (error: Errors) => {
        if (error) {
          return callback(error);
        }

        try {
          const request = (this.databaseConnection as ConnectionPool).request();
          await request.query(`
              DELETE FROM ${this.table} 
              WHERE expires <= GET${this.useUTC ? 'UTC' : ''}DATE()`);

          if (this.autoRemoveCallback) {
            this.autoRemoveCallback();
          }
          return callback();
        } catch (error) {
          if (this.autoRemoveCallback) {
            this.autoRemoveCallback(error);
          }
          return callback(error);
        }
      });
    }
    //////////////////////////////////////////////////////////////////
    // Fetch number of sessions
    /**
     * @param callback
     */
    ////////////////////////////////////////////////////////////////
    length(callback: LengthCallback) {
      this.ready(async (error: Errors) => {
        if (error) {
          return callback(error);
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
    clear(callback: CommonCallback) {
      this.ready(async (error: Errors) => {
        if (error) {
          return callback(error);
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
  };
};

export default Store;
