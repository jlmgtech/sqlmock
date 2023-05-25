const {get, set} = require('./globals.js');
const cartesian = require("./cartesian.js");
const evaluate_binary_expr = require("./evaluate_binary_expr.js");

module.exports = function evaluate_update(evaluate, database, ast) {
    if (ast.with) {
        throw new Error("UPDATE statements do not support WITH.");
    }

    if (ast.table.length !== 1) {
        throw new Error("UPDATE statements must have exactly ONE table.");
    }
    const table = ast.table[0];
    if (table.db) {
        throw new Error("UPDATE statements do not support database prefixes.");
    }
    if (table.as) {
        throw new Error("UPDATE statements do not support table aliases.");
    }

    const tname = table.table;
    const schema = database.__schema__;
    const set = ast.set;
    const where = ast.where;
    const orderby = ast.orderby;
    const limit = ast.limit;

    if (orderby) {
        throw new Error("UPDATE statements do not yet support ORDER BY");
    }

    if (limit) {
        throw new Error("UPDATE statements do not support LIMIT yet");
    }

    const whereFilter = where ?
        evaluate_binary_expr(evaluate(database), where) :
        () => true;

    const setters = set ? set.map(s => row => {
        row[tname][s.column] = s.value.value;
    }) : [];


    // let's validate the operation before we start:

    // check the schema to make sure the table exists:
    if (!(tname in schema)) {
        throw new Error("UPDATE table does not exist: " + tname);
    }

    // check the schema to make sure the fields exist:
    for (const s of set) {
        if (!(s.column in schema[tname])) {
            throw new Error("UPDATE column does not exist: " + s.column);
        }
    }

    // check the types of the values:
    for (const s of set) {
        const col = s.column;
        const val = s.value.value;
        if (schema[tname][col].type !== typeof val) {
            throw new Error(
                `UPDATE value for column '${col}' in table '${tname}' ` +
                `is type '${typeof val}' but should be '${schema[tname][col].type}'`
            );
        }
    }

    return () => {
        set("from_tables", [tname]);

        // use the cartesian function to invert the SoA to AoS:
        const data = {};
        data[tname] = database[tname];
        let rows = cartesian(data);
        // great, now instead of [table1: [], table2: []]
        // we have [{table1: row1, table2: row1}, {table1: row2, table2: row2}]

        // 1. find the data that will be updated:
        rows = rows.filter(whereFilter);

        // 2. update the data:
        for (const row of rows) {
            for (const setter of setters) {
                setter(row);
            }
        }

        // 3. return the number of rows updated:
        set("from_tables", []);
        return rows.length;
    };
};
