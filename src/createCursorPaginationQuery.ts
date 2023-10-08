import { createCursorSqlFragment } from './createCursorSqlFragment';
import { type CursorValue, type OrderMember } from './types';
import {
  type IdentifierSqlToken,
  type QuerySqlToken,
  sql,
  type SqlToken,
} from 'slonik';
import { type z, type ZodTypeAny } from 'zod';

const getColumnIdentifiers = <T>(tableAlias: string) => {
  return new Proxy(
    {},
    {
      get: (_target, property: string) =>
        sql.identifier([tableAlias, property]),
    },
  ) as Record<keyof T, IdentifierSqlToken>;
};

export const createCursorPaginationQuery = <T extends ZodTypeAny>({
  after,
  before,
  query,
  first,
  orderBy,
}: {
  after?: CursorValue[];
  before?: CursorValue[];
  first: number;
  orderBy: (
    identifiers: Record<keyof z.infer<T>, IdentifierSqlToken>,
  ) => OrderMember[];
  query: QuerySqlToken<T>;
}) => {
  const columnIdentifiers = getColumnIdentifiers<T>('t1');

  const orderMembers = orderBy(columnIdentifiers);

  const conditions: SqlToken[] = [];

  if (after && before) {
    throw new Error('Cannot use both "after" and "before"');
  } else if (after) {
    const cursor = createCursorSqlFragment(orderMembers, after);

    conditions.push(cursor);
  } else if (before) {
    const cursor = createCursorSqlFragment(orderMembers, before, true);

    conditions.push(cursor);
  }

  const queryFinal = sql.type(query.parser)`
    SELECT *
    FROM (${query}) t1
    ${
      conditions.length
        ? sql.fragment`WHERE ${sql.join(conditions, sql.fragment` AND `)}\n    `
        : sql.fragment``
    }ORDER BY ${sql.join(
      orderMembers.map(([column, direction]) => {
        if (before) {
          return direction === 'ASC'
            ? sql.fragment`${column} DESC`
            : sql.fragment`${column} ASC`;
        }

        return direction === 'ASC'
          ? sql.fragment`${column} ASC`
          : sql.fragment`${column} DESC`;
      }),
      sql.fragment`, `,
    )}
    LIMIT ${first + 1}
  `;

  // console.log(queryFinal.sql);

  return queryFinal;
};
