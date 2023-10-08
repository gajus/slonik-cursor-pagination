import { type SqlToken } from 'slonik';

type OrderDirection = 'ASC' | 'DESC';

export type OrderMember = [SqlToken, OrderDirection];
export type CursorValue = string | number;
