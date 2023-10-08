import { createCursorPaginationQuery } from './createCursorPaginationQuery';
import test from 'ava';
import { sql } from 'slonik';
import { z } from 'zod';

test('builds a query to retrieve the first 3 records, ordered by 2 identifiers', async (t) => {
  t.like(
    createCursorPaginationQuery({
      first: 3,
      orderBy: ({ age, name }) => {
        return [
          [name, 'ASC'],
          [age, 'DESC'],
        ];
      },
      query: sql.type(
        z.object({ age: z.number(), id: z.number(), name: z.string() }),
      )`
      SELECT id, name, age
      FROM person
    `,
    }),
    {
      sql: `
    SELECT *
    FROM (
      SELECT id, name, age
      FROM person
    ) t1
    ORDER BY "t1"."name" ASC, "t1"."age" DESC
    LIMIT $1
  `,
      type: 'SLONIK_TOKEN_QUERY',
      values: [4],
    },
  );
});

test('builds a query to retrieve the first 3 records after X, ordered by 2 identifiers', async (t) => {
  t.like(
    createCursorPaginationQuery({
      after: ['a', 1],
      first: 3,
      orderBy: ({ age, name }) => {
        return [
          [name, 'ASC'],
          [age, 'DESC'],
        ];
      },
      query: sql.type(
        z.object({ age: z.number(), id: z.number(), name: z.string() }),
      )`
      SELECT id, name, age
      FROM person
    `,
    }),
    {
      sql: `
    SELECT *
    FROM (
      SELECT id, name, age
      FROM person
    ) t1
    WHERE (("t1"."name" > $1) OR ("t1"."name" = $2 AND "t1"."age" < $3))
    ORDER BY "t1"."name" ASC, "t1"."age" DESC
    LIMIT $4
  `,
      type: 'SLONIK_TOKEN_QUERY',
      values: ['a', 'a', 1, 4],
    },
  );
});

test('builds a query to retrieve the first 3 records before X, ordered by 2 identifiers', async (t) => {
  t.like(
    createCursorPaginationQuery({
      before: ['a', 1],
      first: 3,
      orderBy: ({ age, name }) => {
        return [
          [name, 'ASC'],
          [age, 'DESC'],
        ];
      },
      query: sql.type(
        z.object({ age: z.number(), id: z.number(), name: z.string() }),
      )`
      SELECT id, name, age
      FROM person
    `,
    }),
    {
      sql: `
    SELECT *
    FROM (
      SELECT id, name, age
      FROM person
    ) t1
    WHERE (("t1"."name" < $1) OR ("t1"."name" = $2 AND "t1"."age" > $3))
    ORDER BY "t1"."name" DESC, "t1"."age" ASC
    LIMIT $4
  `,
      type: 'SLONIK_TOKEN_QUERY',
      values: ['a', 'a', 1, 4],
    },
  );
});
