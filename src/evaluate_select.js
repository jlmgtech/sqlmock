const {get, set} = require('./globals.js');

module.exports = function evaluate_select(database, ast) {

    const from_tables = ast.from?.map(f => f.table) ?? [];
    set("from_tables", from_tables);
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

};
