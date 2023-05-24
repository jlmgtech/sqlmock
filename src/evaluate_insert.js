module.exports = function evaluate_insert(database, ast) {

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
        if (typeof schema[tname] === undefined) {
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
        if (vals.length !== ast.values[0].value.length) {
            throw new Error("INSERT number of values must match the number of columns.");
        }

        // 4th, check that the values are the correct type, and build the row:
        const insert_row = {};
        for (let i = 0; i < vals.length; i++) {
            const val = vals[i];
            const col = ast.columns[i];

            // check the type match in the schema:
            if (schema[tname][col].type !== typeof val) {
                throw new Error(
                    `INSERT value for column '${col}' in table '${tname}' ` +
                    `is type '${typeof val}' but should be '${schema[tname][col].type}'`
                );
            }

            // update the insert row
            insert_row[col] = val;
        }

        // finally, check constraints:
        // TODO: check constraints
        // ERS only really uses and therefore supports NOT NULL constraints.
        for (const col of Object.keys(schema[tname])) {

            // make sure auto_increment fields are numbers:
            if (schema[tname][col].auto_increment) {

                if (schema[tname][col].type !== "number") {
                    throw new Error(
                        `INSERT failed because column '${col}' in table '${tname}' ` +
                        `is an auto_increment column but is not a number`
                    );
                }

                // make sure they're not specifying a value for an auto_increment field:
                if (insert_row[col] !== undefined) {
                    throw new Error(
                        `INSERT failed because column '${col}' in table '${tname}' ` +
                        `is an auto_increment column but a value was specified`
                    );
                }

                if (!insert_row[col]) {
                    // auto increment the value
                    // find the max value in the table, and add one.
                    const newid = database[tname].map(row => row[col]).reduce((a, b) => Math.max(a, b), 0) + 1;
                    insert_row[col] = newid;
                }

            }

            if (schema[tname][col].not_null && !insert_row[col]) {
                throw new Error(
                    `INSERT value for column '${col}' in table '${tname}' ` +
                    `cannot be NULL`
                );
            }

            // autofill empty values to null
            if (insert_row[col] === undefined) {
                insert_row[col] = null;
            }
        }

        // and insert:
        database[tname].push(insert_row);
        return 1;
    };

};
