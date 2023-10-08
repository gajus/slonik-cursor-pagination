/* eslint-disable no-console */

import { randomUUID } from 'node:crypto';
import { createPool, type DatabasePool, sql } from 'slonik';

// eslint-disable-next-line node/no-process-env
const POSTGRES_DSN = process.env.POSTGRES_DSN ?? 'postgres@localhost:5432';

type TestRoutine = (context: { connectionURI: string }) => Promise<void>;

const teardown = async (pool: DatabasePool, databaseName: string) => {
  await pool.connect(async (connection) => {
    await connection.query(sql.unsafe`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE
        pid != pg_backend_pid() AND
        datname = 'slonik_test'
    `);
    await connection.query(
      sql.unsafe`DROP DATABASE IF EXISTS ${sql.identifier([databaseName])}`,
    );
  });
};

export const withDatabase = async (routine: TestRoutine) => {
  const testId = randomUUID();

  const TEST_DATABASE_NAME = ['slonik_test', testId.split('-')[0]].join('_');

  const testDatabaseConnectionURI =
    'postgresql://' + POSTGRES_DSN + '/' + TEST_DATABASE_NAME;

  const setupPool = await createPool('postgresql://' + POSTGRES_DSN, {
    maximumPoolSize: 1,
  });

  await setupPool.connect(async (connection) => {
    await connection.query(sql.unsafe`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE
        pid != pg_backend_pid() AND
        datname = 'slonik_test'
    `);
    await connection.query(
      sql.unsafe`DROP DATABASE IF EXISTS ${sql.identifier([
        TEST_DATABASE_NAME,
      ])}`,
    );
    await connection.query(
      sql.unsafe`CREATE DATABASE ${sql.identifier([TEST_DATABASE_NAME])}`,
    );
  });

  await setupPool.end();

  try {
    await routine({ connectionURI: testDatabaseConnectionURI });
  } finally {
    const pool = await createPool('postgresql://' + POSTGRES_DSN, {
      maximumPoolSize: 1,
    });

    // eslint-disable-next-line promise/prefer-await-to-then
    void teardown(pool, TEST_DATABASE_NAME).finally(() => {
      pool.end();
    });
  }
};
