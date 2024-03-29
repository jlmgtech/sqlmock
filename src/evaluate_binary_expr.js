module.exports = function evaluate_binary_expr(evaluate, ast) {

    const lhs = evaluate(ast.left); // usually column_ref
    if (typeof lhs !== "function") {
        console.error("AST LEFT", ast.left);
        throw new TypeError(`lhs needs to be a function for '${ast.left.type}' node`);
    }

    const rhs = evaluate(ast.right); // usually column_ref
    if (typeof rhs !== "function") {
        console.error("AST RIGHT", ast.right);
        throw new TypeError(`rhs needs to be a function for '${ast.right.type}' node`);
    }

    switch (ast.operator) {
        // boolean operators:
        case "LIKE": {
            return (row) => {
                const expr = rhs(row)
                    .replace(/%/g, ".*")
                    .replace(/_/g, ".")
                    .replace(/\\/g, "\\\\");
                const regex = new RegExp(`^${expr}$`);
                return regex.test(lhs(row));
            };
        }
        case "IN": {
            return (row) => {
                return (
                    rhs(row)
                    .map(r=>r(row))
                    .includes(lhs(row))
                );
            };
        }
        case "=": {
            return (row) => {
                // determine table name of column
                // if not provided.
                // row looks like {
                //  users: {id: 1, name: "John Doe"},
                //  actors: {id: 1, fname: "John", lname: "Doe"}
                // }
                return lhs(row) == rhs(row);
                //row[lhs] == rhs;
            };
        }
        case "IS": {
            if (rhs === null) {
                return (row) => row[lhs] == null;
            } else {
                return (row) => row[lhs] === rhs;
            }
        }
        case "<>":
        case "!=": {
            return (row) => row[lhs] != rhs;
        }
        case ">": {
            return (row) => row[lhs] > rhs;
        }
        case ">=": {
            return (row) => row[lhs] >= rhs;
        }
        case "<": {
            return (row) => row[lhs] < rhs;
        }
        case "<=": {
            return (row) => row[lhs] <= rhs;
        }
        case "AND": {
            return (row) => lhs(row) && rhs(row);
        }
        case "OR": {
            return (row) => lhs(row) || rhs(row);
        }

        // arithmetic operators:
        case "+": {
            return (row) => lhs(row) + rhs(row);
        }
        case "-": {
            return (row) => lhs(row) - rhs(row);
        }
        case "*": {
            return (row) => lhs(row) * rhs(row);
        }
        case "/": {
            return (row) => lhs(row) / rhs(row);
        }
        case "%": {
            return (row) => lhs(row) % rhs(row);
        }
        case "^": {
            return (row) => lhs(row) ** rhs(row);
        }

        // bitwise operators:
        case "&": {
            return (row) => lhs(row) & rhs(row);
        }
        case "|": {
            return (row) => lhs(row) | rhs(row);
        }
        case "<<": {
            return (row) => lhs(row) << rhs(row);
        }
        case ">>": {
            return (row) => lhs(row) >> rhs(row);
        }
        case "~": {
            return (row) => lhs(row) ^ rhs(row);
        }

        default:
            throw new Error(`Unsupported operator: "${ast.operator}"`);
    }
};
