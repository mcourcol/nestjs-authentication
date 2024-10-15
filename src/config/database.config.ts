import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';

export const sqliteConfig: SqliteConnectionOptions = {
  type: 'sqlite',
  database: 'database.sqlite',
  entities: ['dist/**/*.entity{.ts,.js}'],
  synchronize: true,
  logging: true,
};
