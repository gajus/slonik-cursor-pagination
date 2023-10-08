import { type SqlToken } from 'slonik';

type OrderDirection = 'ASC' | 'DESC';

export type OrderMember = [SqlToken, OrderDirection];
export type CursorValue = string | number;

export type PageInfo = {
  endCursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
};
