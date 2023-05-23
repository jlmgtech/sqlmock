
let FROM_TABLES = [];
function evaluate(database) {
    return ast => {

        if (!ast) {
            return null;
        }

        switch (ast.type) {

            case "select": {
                const from_tables = ast.from.map(f => f.table);
                FROM_TABLES = from_tables;
                const filter = evaluate(database)(ast.where);
                // TODO - ON filter also!

                const offset = null; // TODO
                const map    = ast.columns === "*" ?
                (a => a) :
                (record) => {
                    // we want to whitelist only the selected columns
                    // that means, probably create a new record built from
                    // the columns that were explicitly labeled:

                    // 1. build an array of columns for each table
                    // whitelist should look like:
                    // {"actors": ["fname"],"users":["id"]}
                    const newrec = {};
                    for (const col of ast.columns) {
                        const as = col.as;
                        const type = col.expr?.type ?? "";
                        const cname = col.expr?.column ?? "";
                        const column_table = col.expr?.table ?? "";
                        if (from_tables.length > 1 && !column_table) {
                            throw new Error(
                                `Ambiguous column '${cname}' when using ` +
                                "multiple tables."
                            );
                        }
                        const tname = column_table || from_tables[0];
                        if (type === "column_ref") {
                            // just copy over the column from the respective table
                            // in the old record
                            newrec[tname] = newrec[tname] || {};
                            const asname = as || cname;
                            newrec[tname][asname] = record[tname][cname];
                        }
                    }

                    return newrec;
                };

                // TODO - order by needs to respect that there are records from multiple tables in each row:
                //const ast_order_by = [
                //    {
                //        expr: { type: 'column_ref', table: '', column: 'fname' },
                //        type: 'ASC'
                //    }
                //];

                const orderby = ast.orderby ? ast.orderby.map(evaluate(database)) : null;

                const limit   = ast.limit ? ast.limit.map(evaluate(database)) : null;

                return () => {

                    // performing a cross join of the relevant tables:
                    // get relevant tables:
                    const data = {};
                    for (const tname of from_tables) {
                        data[tname] = database[tname];
                    }

                    // perform join:
                    let joined = cartesian(data);

                    if (filter) {
                        // filtering using "where" AND "on":
                        joined = joined.filter(filter);
                    }
                    if (orderby) {
                        console.log("ORDER BY: ", orderby.toString());
                        let sorter;
                        while (sorter = orderby.pop()) {
                            const sort = sorter();
                            joined = joined.sort(sort);
                        }
                    }
                    if (offset) {
                        joined = joined.slice(...limit);
                    }
                    if (limit) {
                        joined = joined.slice(0, ...limit);
                    }

                    // now filter the columns:
                    joined = joined.map(map);

                    // combine tables into single output object:
                    // BUT! Throw an error if there are any duplicate column names
                    const results = [];
                    for (const row of joined) {

                        // check that the rows don't contain any duplicate column names:
                        const previous_columns = new Set();
                        for (const [tablename, tablerow] of Object.entries(row)) {
                            for (const column_name of Object.keys(tablerow)) {
                                if (previous_columns.has(column_name)) {
                                    throw new Error(`Duplicate column name: ${column_name}`);
                                }
                                previous_columns.add(column_name);
                            }

                        }

                        results.push(Object.assign({}, ...Object.values(row)));
                    }

                    return results;
                };

            }

            case "null": {
                return null;
            }

            case "binary_expr": {

                const lhs = evaluate(database)(ast.left);
                if (typeof lhs !== "function") {
                    throw new TypeError(`lhs needs to be a function for '${ast.left.type}' node`);
                }

                const rhs = evaluate(database)(ast.right);
                if (typeof rhs !== "function") {
                    throw new TypeError(`rhs needs to be a function for '${ast.right.type}' node`);
                }

                switch (ast.operator) {
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
                    default:
                        throw new Error(`Unsupported operator: "${ast.operator}"`);
                }
            }

            case "column_ref": {
                return (row) => {
                    if (!row) throw new Error("row is undefined");
                    if (!ast.table && Object.keys(row).length > 1) {
                        throw new Error(
                            `Ambiguous column reference "${ast.column}"; if you are ` +
                            "using multiple tables, you must specify the table name."
                        );
                    }
                    const table = ast.table || Object.keys(row)[0];
                    return row[table][ast.column];
                };
            }

            case "string": {
                return (row) => ast.value;
            }
            case "ASC": {
                // return sorting comparator; only one column supported for now
                //const column = evaluate(database)(ast.expr);
                if (!ast.expr.table && FROM_TABLES.length > 1) {
                    throw new Error(`Cannot ORDER BY ambiguous table '${ast.expr.table}'`);
                }
                const table = ast.expr.table || FROM_TABLES[0];
                return row => (a, b) => a[table][ast.expr.column] < b[table][ast.expr.column] ? -1 : 1;
            }
            case "DESC": {
                const column = evaluate(database)(ast.expr);
                return (a, b) => a[column] > b[column] ? -1 : 1;
            }
            case "number": {
                return () => ast.value;
            }
            case "expr_list": {
                return () => ast.value.map(evaluate(database));
            }
            case "single_quote_string": {
                return () => ast.value;
            }
            default:
                if (!ast.type && ast.ast) {
                    // probably a select statement:
                    return evaluate(database)(ast.ast);
                } else {
                    console.error("ERROR:", ast);
                    throw new Error(`"${ast.type}" is not implemented`);
                }

        }

    };
}

function cartesian(tables) {
    // perform cartesian product of all tables
    // https://stackoverflow.com/a/43053803/1123955
    // Tables is an object with keys as table names
    // and values as a collection of rows. It can specify 1 or more tables.
    // e.g. { "table1": [ { "id": 1, "name": "foo" }, ... ], ... }
    // We want to a cartesian product of all the rows
    // e.g. [ {"table1": {...table1row}, "table2": {...table2row}}, ... ]
    // use for loops instead of map/filter/reduce for performance reasons.


    const output = [];
    for (const [table, data] of Object.entries(tables)) {
        if (!data) {
            console.trace();
            process.exit(0);
        }
        if (output.length === 0) {
            for (const row of data) {
                output.push({[table]: row});
            }
        } else {
            const newOutput = [];
            for (const row of data) {
                for (const outputRow of output) {
                    newOutput.push({...outputRow, [table]: row});
                }
            }
            output.length = 0;
            output.push(...newOutput);
        }
    }
    return output;

}

module.exports = evaluate;
