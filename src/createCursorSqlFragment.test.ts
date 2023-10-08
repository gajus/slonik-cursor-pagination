import { createCursorSqlFragment } from './createCursorSqlFragment';
import test from 'ava';
import { sql } from 'slonik';

test('builds a cursor (single dimension)', async (t) => {
  t.is(
    createCursorSqlFragment([[sql.identifier(['t1', 'name']), 'ASC']], ['a'])
      .sql,
    `(("t1"."name" > $1))`,
  );
});

test('builds a cursor (two dimensions)', async (t) => {
  t.deepEqual(
    createCursorSqlFragment(
      [
        [sql.identifier(['t1', 'name']), 'ASC'],
        [sql.identifier(['t1', 'age']), 'DESC'],
      ],
      ['a', 1],
    ),
    {
      sql: `(("t1"."name" > $1) OR ("t1"."name" = $2 AND "t1"."age" < $3))`,
      type: 'SLONIK_TOKEN_FRAGMENT',
      values: ['a', 'a', 1],
    },
  );
});

test('builds a cursor (three dimensions)', async (t) => {
  t.is(
    createCursorSqlFragment(
      [
        [sql.identifier(['t1', 'name']), 'ASC'],
        [sql.identifier(['t1', 'age']), 'DESC'],
        [sql.identifier(['t1', 'id']), 'ASC'],
      ],
      ['a', 1, 2],
    ).sql,
    `(("t1"."name" > $1) OR ("t1"."name" = $2 AND "t1"."age" < $3) OR ("t1"."name" = $4 AND "t1"."age" = $5 AND "t1"."id" > $6))`,
  );
});
