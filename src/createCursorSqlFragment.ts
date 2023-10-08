import { type CursorValue, type OrderMember } from './types';
import { sql, type SqlToken } from 'slonik';

export const createCursorSqlFragment = (
  orderMembers: OrderMember[],
  cursorValues: CursorValue[],
  reverse: boolean = false,
) => {
  const conditions: SqlToken[] = [];

  for (let index = 0; index < orderMembers.length; index++) {
    const [, direction] = orderMembers[index];

    const currentCondition: SqlToken[] = [];
    for (let index1 = 0; index1 <= index; index1++) {
      const [innerColumn] = orderMembers[index1];
      const innerValue = cursorValues[index1];

      if (index1 < index) {
        currentCondition.push(sql.fragment`${innerColumn} = ${innerValue}`);
      } else {
        const comparisonOperator =
          direction === 'ASC' && index1 === index
            ? reverse
              ? sql.fragment`<`
              : sql.fragment`>`
            : direction === 'DESC' && index1 === index
            ? reverse
              ? sql.fragment`>`
              : sql.fragment`<`
            : sql.fragment`=`;

        currentCondition.push(
          sql.fragment`${innerColumn} ${comparisonOperator} ${innerValue}`,
        );
      }
    }

    conditions.push(
      sql.fragment`(${sql.join(currentCondition, sql.fragment` AND `)})`,
    );
  }

  const fragment = sql.fragment`(${sql.join(conditions, sql.fragment` OR `)})`;

  return {
    ...fragment,
    sql: fragment.sql.trim(),
  };
};
