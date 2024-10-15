import { registerAs } from '@nestjs/config';
import { SqliteConnectionOptions } from 'typeorm/driver/sqlite/SqliteConnectionOptions';

export default registerAs(
  'database-config',
  (): SqliteConnectionOptions => ({
    type: 'sqlite',
    database: process.env.DB_PATH,
    entities: ['dist/**/*.entity{.ts,.js}'],
    synchronize: true,
    logging: true,
  }),
);
