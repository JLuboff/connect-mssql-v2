import sql, { config as SQLConfig, NVarChar, MAX, DateTime } from 'mssql';

interface StoreOptions {
  table?: string;
  ttl?: number;
  autoRemove?: boolean;
  autoRemoveInterval?: number;
  autoRemoveCallback?: any;
}
type Callback = (a?: any, b?: any) => void;
const Store= (session: any) => {
  const Store = session.Store || session.session.Store;
  class MSSQLStore extends Store {
    constructor(config: SQLConfig, options: StoreOptions) {
      super();
      this.table = options.table || 'sessions';
      this.ttl = options.ttl || 1000 * 60 * 60 * 24;
      this.autoRemove = options.autoRemove || false;
      this.autoRemoveInterval = options.autoRemoveInterval || 1000 * 60 * 10;
      this.config = config;
    }

    private databaseConnection = new sql.ConnectionPool(this.config);
    async initializeDatabase() {
      try {
        await this.databaseConnection.connect();
        if (this.autoRemove) {
          this.destroyExpired();
          setInterval(this.destroyExpired.bind(this), this.autoRemoveInterval);
        }
      } catch (error) {
        console.error(error)
        throw error;
      }
    }
    private ready(callback: Callback) {
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
          return callback(err);
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
          return callback(err);
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
    private destroyExpired() {}
  }
  return MSSQLStore;
};

export default Store;