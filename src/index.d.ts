import sql, {
  config as SQLConfig,
  ConnectionPool,
  ConnectionError
} from 'mssql';

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
   * Determines if expired sessions should be autoremoved or not. If value is `true` then a new function, `destroyExpired()`,
   * will autodelete expired sessions on a set interval. Default: `false`
   */
  autoRemove?: boolean;
  /**
   * Sets the timer interval for each call to `destroyExpired()`. Default: `1000 * 60 * 10` (10 min)
   */
  autoRemoveInterval?: number;
  /**
   * (NOT CURRENTLY TESTED) Is the callback function for `destroyExpired()`. Default: `undefined`
   */
  autoRemoveCallback?: (props: any) => any;
  /**
   * Determines if we are to use the `GETUTCDATE` instead of `GETDATE` Default: `true`
   */
  useUTC?: boolean;
}
export type Cookie = { cookie: { expires: Date } };
export type Errors = ConnectionError | Error | null;
export type GetCallback = (
  error: Errors,
  session?: Express.SessionData | null
) => void;
export type LengthCallback = (error: Errors, length?: number) => void;
export type CommonCallback = (args?: any[] | null | Errors) => void;
export type ReadyCallback = (error: Errors, cb?: any) => Promise<any>;

export interface IMSSQLStore {
  config: SQLConfig;
  options?: StoreOptions;
  databaseConnection: ConnectionPool | null;
  initializeDatabase(): void;
  get(sid: string, callback: GetCallback): void;
  set(sid: string, data: any, callback: CommonCallback): void;
  touch(sid: string, data: Cookie, callback: CommonCallback): void;
  destroy(sid: string, callback: CommonCallback): void;
  destroyExpired(callback: CommonCallback): void;
  length(callback: LengthCallback): void;
  clear(callback: CommonCallback): void;
}
