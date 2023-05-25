const cartesian = require("./cartesian.js");
const evaluate_insert = require("./evaluate_insert.js");
const evaluate_update = require("./evaluate_update.js");
const evaluate_delete = require("./evaluate_delete.js");
const evaluate_binary_expr = require("./evaluate_binary_expr.js");
const {get, set} = require("./globals.js");

function evaluate(database) {

    return ast => {

        if (typeof ast !== "object") {
            throw new Error("evaluate: ast must be a valid ast object");
        }

        if (!ast) {
            throw new Error("AST is empty");
        }

        switch (ast.type) {

            case "insert":
                return evaluate_insert(database, ast);

            case "update":
                return evaluate_update(evaluate, database, ast);

            case "delete":
                return evaluate_delete(evaluate, database, ast);

            case "select": {

                const from_tables = ast.from?.map(f => f.table) ?? [];
                set("from_tables", from_tables);
                const whereFilter = ast.where ?
                    evaluate(database)(ast.where) :
                    () => true;

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

                const limit = ast.limit ? evaluate_limit(database, ast.limit) : null;

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

                    if (limit) {
                        joined = joined.slice(0, ...limit);
                    }
                    if (offset) {
                        if (limit) {
                            limit[0] = offset;
                        }
                        joined = (
                            joined
                            .slice(limit[0])
                            .slice(0, limit[1])
                        );
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

            case "binary_expr":
                return evaluate_binary_expr(evaluate(database), ast);

            case "column_ref": {
                return (row, setvalue) => {
                    if (!row) throw new Error("row is undefined");
                    if (!ast.table && get("from_tables").length > 1) {
                        console.log(ast.table);
                        console.log(Object.keys(row));
                        throw new Error(
                            `Ambiguous column reference "${ast.column}"; if you are ` +
                            "using multiple tables, you must specify the table name."
                        );
                    }
                    const table = ast.table || get("from_tables")[0];
                    return row[table][ast.column];
                };
            }

            case "string": {
                return (row) => ast.value;
            }

            case "ASC": {
                // return sorting comparator; only one column supported for now
                //const column = evaluate(database)(ast.expr);
                if (!ast.expr.table && get("from_tables").length > 1) {
                    throw new Error(`Cannot ORDER BY ambiguous table '${ast.expr.table}'`);
                }
                const table = ast.expr.table || get("from_tables")[0];
                return row => (a, b) => a[table][ast.expr.column] < b[table][ast.expr.column] ? -1 : 1;
            }

            case "DESC": {
                // return sorting comparator; only one column supported for now
                //const column = evaluate(database)(ast.expr);
                if (!ast.expr.table && get("from_tables").length > 1) {
                    throw new Error(`Cannot ORDER BY ambiguous table '${ast.expr.table}'`);
                }
                const table = ast.expr.table || get("from_tables")[0];
                return row => (a, b) => a[table][ast.expr.column] > b[table][ast.expr.column] ? -1 : 1;
            }

            case "number": {
                return () => ast.value;
            }

            case "null": {
                return () => ast.value;
            }

            case "expr_list": {
                return () => ast.value.map(evaluate(database));
            }

            case "single_quote_string": {
                return () => ast.value;
            }

            default:
                throw new Error(`"${ast.type}" not supported`);

        }

    };
}
function evaluate_limit(database, astlimit) {
    let limit = astlimit.value.map(l => evaluate(database)(l)())
    if (limit.length === 1) {
        limit.unshift(0);
    }
    return limit;
}


module.exports = evaluate;
