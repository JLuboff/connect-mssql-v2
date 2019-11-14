import sql, { config as SQLConfig, NVarChar, MAX, DateTime } from 'mssql';

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
    constructor(config: SQLConfig, options: StoreOptions) {
      super();
      this.table = options.table || 'sessions';
      this.ttl = options.ttl || 1000 * 60 * 60 * 24;
      this.autoRemove = options.autoRemove || false;
      this.autoRemoveInterval = options.autoRemoveInterval || 1000 * 60 * 10;
      this.autoRemoveCallback = options.autoRemoveCallback || undefined;
      this.useUTC = options.useUTC || true;
      this.config = config;
    }

    private databaseConnection = new sql.ConnectionPool(this.config);
    async initializeDatabase() {
      try {
        await this.databaseConnection.connect();
        this.databaseConnection.on('connect', this.emit.bind(this, 'connect'));
        this.databaseConnection.on('error', this.emit.bind(this, 'error'));

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
      if (this.databaseConnection.connected) {
        return callback.call(this, null, null);
      }
      if (this.databaseConnection.connecting) {
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
          const request = this.databaseConnection.request();
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
          const request = this.databaseConnection.request();
          await request
            .input('sid', NVarChar(255), sid)
            .input('session', NVarChar(MAX))
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
          const request = this.databaseConnection.request();
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
          const request = this.databaseConnection.request();
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
          const request = this.databaseConnection.request();
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
          const request = this.databaseConnection.request();
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
          const request = this.databaseConnection.request();
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
