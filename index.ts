import _users from "./data/users.json"
import { User } from "./types/User";

const users = _users as User[];

type Expression<T> = {
  key: keyof T;
  operation: "gt" | "lt" | "eq" | "starts_with" | "contains",
  value: string | number;
}


type Query<T> = {
  condition: "and" | "or",
  expressionsOrQueries: QueryOrExpression<T>[]
}

type QueryOrExpression<T> = Expression<T> | Query<T>

const user_query: Query<User> = {
  condition: "and",
  expressionsOrQueries: [
    {
      condition: "or",
      expressionsOrQueries: [
        { key: "first_name", operation: "starts_with", value: "E" },
        { key: "first_name", operation: "starts_with", value: "B" },
        {
          condition: "and",
          expressionsOrQueries: [
            { key: "age", operation: "gt", value: 60 },
            { key: "age", operation: "lt", value: 80 },
          ]
        }
      ]
    },
  ],
}



function evaluateExpression<T>(expression: Expression<T>, obj: T): boolean {
  const { key, operation, value } = expression;
  const propValue = obj[key]
  switch (operation) {
    case "gt": return propValue > value;
    case "lt": return propValue < value;
    case "contains": return new RegExp(value + "").test(propValue + "")
    case "starts_with": return new RegExp("^" + value + "").test(propValue + "")
    case "eq":
    default:
      return propValue === value;
  }
}

function evaluateQuery<T>(query: Query<T>, obj: T): boolean {
  const { condition, expressionsOrQueries } = query;
  const fn = condition == "and" ? expressionsOrQueries.every : expressionsOrQueries.some;

  return fn.call(expressionsOrQueries, (expr) => {
    const isQuery = "condition" in expr;
    if (isQuery) {
      return evaluateQuery(expr, obj)
    } else {
      return evaluateExpression(expr, obj);
    }
  })
}

const result = users.filter(user => evaluateQuery(user_query, user))

console.log(result.length)

