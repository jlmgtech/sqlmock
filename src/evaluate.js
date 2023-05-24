
let FROM_TABLES = [];
function evaluate(database) {

    return ast => {

        if (typeof ast !== "object") {
            throw new Error("evaluate: ast must be a valid ast object");
        }

        if (!ast) {
            return null;
        }

        switch (ast.type) {

            case "insert":
                return evaluateInsert(database, ast);

            case "select": {

                const from_tables = ast.from?.map(f => f.table) ?? [];
                FROM_TABLES = from_tables;
                const filter = evaluate(database)(ast.where);
                // TODO - ON filter also!

                const offset = null; // TODO
                const output_columns = ast.columns === "*" ?
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

                        // do checking to make sure columns are legit:
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
                            otherval = record[tname][cname];
                            newrec[tname][asname] = otherval;
                        } else {
                            console.log(type);
                            const asname = as || type;
                            newrec[tname][asname] = evaluate(database)(type);
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
                    if (!from_tables || from_tables.length === 0) {
                        throw new Error("Selecting an anonymous expression is not supported (e.g. SELECT 1;)");
                    }

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

                    // remove any columns that weren't "selected":
                    joined = joined.map(output_columns);

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
                return (row, setvalue) => {
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

                    // This is a top-level statement:
                    // check that the columns and tables etc exist against the schema!
                    FROM_TABLES = [];
                    const schema = database.__schema__;


                    // check that the tables ACTUALLY EXIST in the schema:
                    for (const tab of ast.tableList) {
                        const [op, dbname, tname] = tab.split(/::/g);
                        if (typeof schema[tname] === "undefined") {
                            throw new Error(`table '${tname}' doesn't exist!`);
                        }
                        if (tname === "__schema__") {
                            throw new Error("__schema__ is not a valid table name!");
                        }
                        FROM_TABLES.push(tname);
                    }

                    // make sure the columns ACTUALLY EXIST in the schema:
                    for (const col of ast.columnList) {
                        const [op, table, cname] = col.split(/::/g);
                        let tname = table;
                        if (tname === "null") {
                            tname = null;
                            // find the table this is supposed to be in!
                            for (const fromtable of FROM_TABLES) {
                                if (typeof schema[fromtable][cname] !== "undefined") {
                                    if (tname !== null) {
                                        throw new Error(
                                            `column '${cname}' is ambiguous af ` +
                                            `(could be in '${tname}' or '${fromtable}')`
                                        );
                                    }
                                    tname = fromtable;
                                }
                            }

                            if (tname === null) {
                                if (FROM_TABLES.length === 1) {
                                    throw new Error(
                                        `table '${FROM_TABLES[0]}' has no ` +
                                        `column named '${cname}'`
                                    );
                                } else {
                                    throw new Error(
                                        'None of the tables ' +
                                        `(${FROM_TABLES.join(', ')}) have a ` +
                                        `column named "${cname}".`
                                    );
                                }
                            }
                        }

                        if (typeof schema[tname][cname] === "undefined") {
                            throw new Error(
                                `column '${cname}' doesn't exist in ` +
                                `schema for table '${table}'`
                            );
                        }
                    }

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

function evaluateInsert(database, ast) {

    return () => {

        // 1st, check for unsupported features:
        if (ast.table.length !== 1) {
            throw new Error("INSERT statements must have exactly ONE table.");
        }
        if (ast.table[0].as) {
            throw new Error("INSERT statement cannot have an alias.");
        }
        if (ast.partition !== null) {
            throw new Error("INSERT statement cannot have a PARTITION clause.");
        }
        if (ast.prefix != "into") {
            throw new Error(
                `INSERT statement does not support ${ast.prefix} ` +
                `clause, only INTO.`
            );
        }
        if (ast.on_duplicate_update) {
            throw new Error("INSERT statement does not support ON DUPLICATE UPDATE.");
        }

        const schema = database.__schema__;

        const tname = ast.table[0].table;
        // 2nd, check that the table exists:
        if (typeof schema[table] === undefined) {
            throw new Error(`Cannot INSERT into unknown table '${tname}'`);
        }

        // 3rd, check that the columns exist in that table:
        for (const col of ast.columns) {
            // check database.__schema__
            if (typeof schema[tname][col] === undefined) {
                throw new Error(`INSERT into unknown column '${col}' in table '${tname}'`);
            }
        }
        if (ast.values.length !== 1) {
            throw new Error("INSERT statements must have exactly ONE set of values.");
        }
        const vals = ast.values[0].value.map(e => e.value);
        if (vals.length !== ast.values[0]) {
            throw new Error("INSERT number of values must match the number of columns.");
        }

        // 4th, check that the values are the correct type, and build the row:
        const insert_row = {};
        for (let i = 0; i < vals.length; i++) {
            const val = vals[i];
            const col = ast.columns[i];

            // check the type match in the schema:
            if (schema[tname][col] !== typeof val) {
                throw new Error(
                    `INSERT value for column '${col}' in table '${tname}' ` +
                    `is type '${typeof val}' but should be '${schema[tname][col]}'`
                );
            }

            // update the insert row
            insert_row[col] = val;
        }

        // finally, check constraints:
        // TODO: check constraints

        // and insert:
        database[tname].push(insert_row);
        return true;
    };

}

module.exports = evaluate;
