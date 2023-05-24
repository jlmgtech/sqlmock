const cartesian = require("./cartesian.js");
const evaluate_insert = require("./evaluate_insert.js");
const evaluate_update = require("./evaluate_update.js");
const evaluate_binary_expr = require("./evaluate_binary_expr.js");
const {GET_FROM_TABLES, SET_FROM_TABLES} = require("./from_tables.js");

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
                return evaluate_insert(database, ast);

            case "update":
                return evaluate_update(evaluate, database, ast);

            case "delete":
                throw new Error("DELETE not yet implemented");

            case "select": {

                const from_tables = ast.from?.map(f => f.table) ?? [];
                SET_FROM_TABLES(from_tables);
                const whereFilter = evaluate(database)(ast.where);
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

                    if (whereFilter) {
                        // filtering using "where" AND "on":
                        joined = joined.filter(whereFilter);
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

            case "binary_expr":
                return evaluate_binary_expr(evaluate(database), ast);

            case "column_ref": {
                return (row, setvalue) => {
                    if (!row) throw new Error("row is undefined");
                    if (!ast.table && GET_FROM_TABLES().length > 1) {
                        console.log(ast.table);
                        console.log(Object.keys(row));
                        throw new Error(
                            `Ambiguous column reference "${ast.column}"; if you are ` +
                            "using multiple tables, you must specify the table name."
                        );
                    }
                    const table = ast.table || GET_FROM_TABLES()[0];
                    return row[table][ast.column];
                };
            }

            case "string": {
                return (row) => ast.value;
            }

            case "ASC": {
                // return sorting comparator; only one column supported for now
                //const column = evaluate(database)(ast.expr);
                if (!ast.expr.table && GET_FROM_TABLES().length > 1) {
                    throw new Error(`Cannot ORDER BY ambiguous table '${ast.expr.table}'`);
                }
                const table = ast.expr.table || GET_FROM_TABLES()[0];
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
                    SET_FROM_TABLES([]);
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
                        SET_FROM_TABLES([...GET_FROM_TABLES(), tname]);
                    }

                    // make sure the columns ACTUALLY EXIST in the schema:
                    for (const col of ast.columnList) {
                        const [op, table, cname] = col.split(/::/g);
                        let tname = table;
                        if (tname === "null") {
                            tname = null;
                            // find the table this is supposed to be in!
                            for (const fromtable of GET_FROM_TABLES()) {
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
                                if (GET_FROM_TABLES().length === 1) {
                                    throw new Error(
                                        `table '${GET_FROM_TABLES()[0]}' has no ` +
                                        `column named '${cname}'`
                                    );
                                } else {
                                    throw new Error(
                                        'None of the tables ' +
                                        `(${GET_FROM_TABLES().join(', ')}) have a ` +
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

module.exports = evaluate;
