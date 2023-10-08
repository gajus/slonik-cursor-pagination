# Slonik Cursor Pagination Query Builder

Effortlessly run cursor pagination queries using [Slonik](https://github.com/gajus/slonik).

## Usage

```ts
import { createPool, sql } from 'slonik';
import { cursorPaginationQuery } from 'slonik-cursor-pagination';

const pool = await createPool('postgres://postgres@localhost:5432/postgres');

const { rows, pageInfo } = await cursorPaginationQuery(pool, {
  // This is the query that will be paginated.
  query: sql.type(
    z.object({
      id: z.number(),
      name: z.string(),
      age: z.number()
    }),
  )`
    SELECT id, name, age
    FROM person
    WHERE age > 18
  `;,
  // At the minimum, you must indicate how many results you want to return per page and in what order.
  first: 5,
  // `age` and `name` are inferred from the query types.
  // You may reference any column that is returned by the query.
  orderBy: ({ age, name }) => {
    return [
      [name, 'ASC'],
      [age, 'DESC'],
    ];
  },
  fromCursor: (cursor) => {
    const [name, age] = Buffer.from(cursor, 'base64').toString('utf-8').split(':');
    return {
      name,
      age: Number(age),
    };
  },
  toCursor: ({ name, age }) => {
    return Buffer.from(`${name}:${age}`).toString('base64');
  },
  // (optional) This is the cursor that will be used to determine the starting point of the query.
  // Note that the order of the columns must match the order of the columns in the `orderBy` function.
  // If `after` is specified, the query will return results that come after the specified cursor.
  after: 'Sm9objoyMA==',
  // (optional) This is the cursor that will be used to determine the starting point of the query.
  // Note that the order of the columns must match the order of the columns in the `orderBy` function.
  // If `before` is specified, the query will return results that come before the specified cursor.
  before: 'Sm9objoyMA==',
});
```

## Development

Running Slonik tests requires having a local PostgreSQL instance.

The easiest way to setup a temporary instance for testing is using Docker, e.g.

```bash
docker run --rm -it -e POSTGRES_HOST_AUTH_METHOD=trust -p 5432:5432 --name slonik-test postgres -N 1000
```
