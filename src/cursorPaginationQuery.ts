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

  const previousRows = await pool.any(
    createCursorPaginationQuery({
      after: before ? fromCursor(before) : undefined,
      before: after ? fromCursor(after) : undefined,
      first: 1,
      orderBy,
      query,
    }),
  );

  const organizedRows = before
    ? rows.slice(0, first).reverse()
    : rows.slice(0, first);

  return {
    pageInfo: {
      endCursor: organizedRows[organizedRows.length - 1]
        ? toCursor(organizedRows[organizedRows.length - 1])
        : null,
      hasNextPage: rows.length === first + 1,
      hasPreviousPage: previousRows.length === 1,
      startCursor: organizedRows[0] ? toCursor(organizedRows[0]) : null,
    },
    rows: organizedRows,
  };
};
