import { cursorPaginationQuery } from './cursorPaginationQuery';
import { withDatabase } from './withDatabase';
import test from 'ava';
import { createPool, type DatabasePool, sql } from 'slonik';
import { z } from 'zod';

const setupDatabase = async (pool: DatabasePool) => {
  await pool.connect(async (connection) => {
    await connection.query(sql.unsafe`
      CREATE TABLE person (
        id SERIAL PRIMARY KEY,
        name text NOT NULL,
        age integer NOT NULL
      )
    `);

    await connection.query(sql.unsafe`
      INSERT INTO person (name, age)
      VALUES ('a', 1), ('b', 2), ('c', 3), ('d', 4), ('e', 5)
    `);
  });
};

test('returns the first 3 records, ordered by 1 identifier ASC', async (t) => {
  await withDatabase(async ({ connectionURI }) => {
    const pool = await createPool(connectionURI);

    await setupDatabase(pool);

    const result = await cursorPaginationQuery(pool, {
      first: 3,
      fromCursor: (cursor) => [cursor],
      orderBy: ({ name }) => {
        return [[name, 'ASC']];
      },
      query: sql.type(z.object({ id: z.number(), name: z.string() }))`
        SELECT id, name
        FROM person
      `,
      toCursor: (row) => row.name,
    });

    t.deepEqual(result, {
      pageInfo: {
        endCursor: 'c',
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: 'a',
      },
      rows: [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 3, name: 'c' },
      ],
    });
  });
});

test('returns the first 3 records, ordered by 1 identifier DESC', async (t) => {
  await withDatabase(async ({ connectionURI }) => {
    const pool = await createPool(connectionURI);

    await setupDatabase(pool);

    const result = await cursorPaginationQuery(pool, {
      first: 3,
      fromCursor: (cursor) => [cursor],
      orderBy: ({ name }) => {
        return [[name, 'DESC']];
      },
      query: sql.type(z.object({ id: z.number(), name: z.string() }))`
        SELECT id, name
        FROM person
      `,
      toCursor: (row) => row.name,
    });

    t.deepEqual(result, {
      pageInfo: {
        endCursor: 'c',
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: 'e',
      },
      rows: [
        { id: 5, name: 'e' },
        { id: 4, name: 'd' },
        { id: 3, name: 'c' },
      ],
    });
  });
});

test('returns the first 3 records after X, ordered by 1 identifier ASC (has next)', async (t) => {
  await withDatabase(async ({ connectionURI }) => {
    const pool = await createPool(connectionURI);

    await setupDatabase(pool);

    const result = await cursorPaginationQuery(pool, {
      after: 'a',
      first: 3,
      fromCursor: (cursor) => [cursor],
      orderBy: ({ name }) => {
        return [[name, 'ASC']];
      },
      query: sql.type(z.object({ id: z.number(), name: z.string() }))`
        SELECT id, name
        FROM person
      `,
      toCursor: (row) => row.name,
    });

    t.deepEqual(result, {
      pageInfo: {
        endCursor: 'd',
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: 'b',
      },
      rows: [
        { id: 2, name: 'b' },
        { id: 3, name: 'c' },
        { id: 4, name: 'd' },
      ],
    });
  });
});

test('returns the first 3 records after X, ordered by 1 identifier DESC (has next)', async (t) => {
  await withDatabase(async ({ connectionURI }) => {
    const pool = await createPool(connectionURI);

    await setupDatabase(pool);

    const result = await cursorPaginationQuery(pool, {
      after: 'e',
      first: 3,
      fromCursor: (cursor) => [cursor],
      orderBy: ({ name }) => {
        return [[name, 'DESC']];
      },
      query: sql.type(z.object({ id: z.number(), name: z.string() }))`
        SELECT id, name
        FROM person
      `,
      toCursor: (row) => row.name,
    });

    t.deepEqual(result, {
      pageInfo: {
        endCursor: 'b',
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: 'd',
      },
      rows: [
        { id: 4, name: 'd' },
        { id: 3, name: 'c' },
        { id: 2, name: 'b' },
      ],
    });
  });
});

test('returns the first 3 records after X, ordered by 1 identifier ASC (does not have next)', async (t) => {
  await withDatabase(async ({ connectionURI }) => {
    const pool = await createPool(connectionURI);

    await setupDatabase(pool);

    const result = await cursorPaginationQuery(pool, {
      after: 'b',
      first: 3,
      fromCursor: (cursor) => [cursor],
      orderBy: ({ name }) => {
        return [[name, 'ASC']];
      },
      query: sql.type(z.object({ id: z.number(), name: z.string() }))`
        SELECT id, name
        FROM person
      `,
      toCursor: (row) => row.name,
    });

    t.deepEqual(result, {
      pageInfo: {
        endCursor: 'e',
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor: 'c',
      },
      rows: [
        { id: 3, name: 'c' },
        { id: 4, name: 'd' },
        { id: 5, name: 'e' },
      ],
    });
  });
});

test('returns the first 3 records after X, ordered by 1 identifier DESC (does not have next)', async (t) => {
  await withDatabase(async ({ connectionURI }) => {
    const pool = await createPool(connectionURI);

    await setupDatabase(pool);

    const result = await cursorPaginationQuery(pool, {
      after: 'd',
      first: 3,
      fromCursor: (cursor) => [cursor],
      orderBy: ({ name }) => {
        return [[name, 'DESC']];
      },
      query: sql.type(z.object({ id: z.number(), name: z.string() }))`
        SELECT id, name
        FROM person
      `,
      toCursor: (row) => row.name,
    });

    t.deepEqual(result, {
      pageInfo: {
        endCursor: 'a',
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor: 'c',
      },
      rows: [
        { id: 3, name: 'c' },
        { id: 2, name: 'b' },
        { id: 1, name: 'a' },
      ],
    });
  });
});

test('returns the first 3 records before X, ordered by 1 identifier ASC (has next)', async (t) => {
  await withDatabase(async ({ connectionURI }) => {
    const pool = await createPool(connectionURI);

    await setupDatabase(pool);

    const result = await cursorPaginationQuery(pool, {
      before: 'e',
      first: 3,
      fromCursor: (cursor) => [cursor],
      orderBy: ({ name }) => {
        return [[name, 'ASC']];
      },
      query: sql.type(z.object({ id: z.number(), name: z.string() }))`
        SELECT id, name
        FROM person
      `,
      toCursor: (row) => row.name,
    });

    t.deepEqual(result, {
      pageInfo: {
        endCursor: 'd',
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: 'b',
      },
      rows: [
        { id: 2, name: 'b' },
        { id: 3, name: 'c' },
        { id: 4, name: 'd' },
      ],
    });
  });
});

test('returns the first 3 records before X, ordered by 1 identifier DESC (has next)', async (t) => {
  await withDatabase(async ({ connectionURI }) => {
    const pool = await createPool(connectionURI);

    await setupDatabase(pool);

    const result = await cursorPaginationQuery(pool, {
      before: 'a',
      first: 3,
      fromCursor: (cursor) => [cursor],
      orderBy: ({ name }) => {
        return [[name, 'DESC']];
      },
      query: sql.type(z.object({ id: z.number(), name: z.string() }))`
        SELECT id, name
        FROM person
      `,
      toCursor: (row) => row.name,
    });

    t.deepEqual(result, {
      pageInfo: {
        endCursor: 'b',
        hasNextPage: true,
        hasPreviousPage: false,
        startCursor: 'd',
      },
      rows: [
        { id: 4, name: 'd' },
        { id: 3, name: 'c' },
        { id: 2, name: 'b' },
      ],
    });
  });
});

test('returns the first 3 records before X, ordered by 1 identifier ASC (does not have next)', async (t) => {
  await withDatabase(async ({ connectionURI }) => {
    const pool = await createPool(connectionURI);

    await setupDatabase(pool);

    const result = await cursorPaginationQuery(pool, {
      before: 'd',
      first: 3,
      fromCursor: (cursor) => [cursor],
      orderBy: ({ name }) => {
        return [[name, 'ASC']];
      },
      query: sql.type(z.object({ id: z.number(), name: z.string() }))`
        SELECT id, name
        FROM person
      `,
      toCursor: (row) => row.name,
    });

    t.deepEqual(result, {
      pageInfo: {
        endCursor: 'c',
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor: 'a',
      },
      rows: [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 3, name: 'c' },
      ],
    });
  });
});

test('returns the first 3 records before X, ordered by 1 identifier DESC (does not have next)', async (t) => {
  await withDatabase(async ({ connectionURI }) => {
    const pool = await createPool(connectionURI);

    await setupDatabase(pool);

    const result = await cursorPaginationQuery(pool, {
      before: 'b',
      first: 3,
      fromCursor: (cursor) => [cursor],
      orderBy: ({ name }) => {
        return [[name, 'DESC']];
      },
      query: sql.type(z.object({ id: z.number(), name: z.string() }))`
        SELECT id, name
        FROM person
      `,
      toCursor: (row) => row.name,
    });

    t.deepEqual(result, {
      pageInfo: {
        endCursor: 'c',
        hasNextPage: false,
        hasPreviousPage: true,
        startCursor: 'e',
      },
      rows: [
        { id: 5, name: 'e' },
        { id: 4, name: 'd' },
        { id: 3, name: 'c' },
      ],
    });
  });
});
