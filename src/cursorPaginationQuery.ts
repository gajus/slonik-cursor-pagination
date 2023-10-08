import { createCursorPaginationQuery } from './createCursorPaginationQuery';
import { type CursorValue, type OrderMember } from './types';
import {
  type CommonQueryMethods,
  type IdentifierSqlToken,
  type QuerySqlToken,
} from 'slonik';
import { type z, type ZodTypeAny } from 'zod';

export const cursorPaginationQuery = async <T extends ZodTypeAny>(
  pool: CommonQueryMethods,
  {
    after,
    before,
    query,
    first,
    orderBy,
    toCursor,
    fromCursor,
  }: {
    after?: string;
    before?: string;
    first: number;
    fromCursor: (cursor: string) => CursorValue[];
    orderBy: (
      identifiers: Record<keyof z.infer<T>, IdentifierSqlToken>,
    ) => OrderMember[];
    query: QuerySqlToken<T>;
    toCursor: (row: z.infer<T>) => string;
  },
) => {
  const rows = await pool.any(
    createCursorPaginationQuery({
      after: after ? fromCursor(after) : undefined,
      before: before ? fromCursor(before) : undefined,
      first,
      orderBy,
      query,
    }),
  );

  return {
    pageInfo: {
      hasNextPage: rows.length === first + 1,
      startCursor: rows[0] ? toCursor(rows[0]) : null,
    },
    rows: before ? rows.slice(0, first).reverse() : rows.slice(0, first),
  };
};
