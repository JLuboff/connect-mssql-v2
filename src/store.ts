import sql, { config as SQLConfig } from 'mssql';

interface StoreOptions {
  table?: string;
  ttl?: number;
  autoRemove?: boolean;
  autoRemoveInterval?: number;
  autoRemoveCallback?: any;
}

module.exports = (session: any) => {
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

    databaseConnection = new sql.ConnectionPool(this.config);
    
  }
};
