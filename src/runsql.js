const {Parser} = require("node-sql-parser");
const {get, set} = require("./globals");
const evaluate = require("./evaluate.js");
const parser = new Parser();
module.exports = function runsql(sql, database) {

    const ast = parser.parse(sql);
    const tables = validate_tables(ast.tableList, database);
    const column_tables = validate_columns(ast.columnList, tables, database);

    const strategy = evaluate(database)(ast.ast);

    // save current state:
    const prev_from_tables = get("from_tables");
    const prev_column_tables = get("column_tables");

    // set new state:
    set("from_tables", tables);
    set("column_tables", column_tables);

    // execute strategy
    const result = strategy();

    // restore previous state:
    set("from_tables", prev_from_tables);
    set("column_tables", prev_column_tables);

    return result;
};

function validate_tables(tables, database) {

    const schema = database.__schema__;
    const from_tables = [];
    for (const table of tables) {

        const [op, db, tname] = table.split("::");

        // multiple tables are not allowed for delete, insert, or update:
        if (["delete", "insert", "update"].includes(op) && tables.length > 1)
            throw new Error(
                `Multiple tables not allowed for "${op}" operation`
            );

        if (db !== "null")
            throw new Error("Database selection not allowed");

        if (tname === "__schema__")
            throw new Error("'__schema__' is a reserved table");

        if (!["delete", "select", "insert", "update"].includes(op))
            throw new Error(`Invalid operation: ${op}`);

        if (!schema.hasOwnProperty(tname))
            throw new Error(`Table ${tname} does not exist`);

        from_tables.push(tname);

    }
    return from_tables;

}

function validate_columns(columns, from_tables, database) {

    const schema = database.__schema__;
    const column_tables = {};

    for (const column of columns) {

        const [op, tname, cname] = column.split("::");

        if (cname === "(.*)") {
            if (from_tables.length > 1) {
                throw new Error(
                    "Wildcard column selection not allowed when using " +
                    "multiple tables."
                );
            }
        } else {

            // check that table is one of the tables in the query
            if (!from_tables.includes(tname))
                throw new Error(`Table ${tname} not in query`);

            // check that column is in the table
            if (!schema[tname].hasOwnProperty(cname))
                throw new Error(`Column ${cname} does not exist in table ${tname}`);

        }

        // and that the operation is supported
        if (!["delete", "select", "insert", "update"].includes(op))
            throw new Error(`Invalid operation: ${op}`);

        // and, if the table is not specified, that the column is unique
        // across all tables in the query (i.e. it is unambiguous).
        // While doing this, create a mapping of the column name to the table
        // name, so that we can use it later to resolve ambiguous columns.
        if (tname === "null") {
            const ambiguous = from_tables.filter(t => schema[t].hasOwnProperty(cname));
            if (ambiguous.length > 1)
                throw new Error(`Column ${cname} is ambiguous`);
            column_tables[cname] = ambiguous[0];
        } else {
            column_tables[cname] = tname;
        }

        // NOTE - the way we want to do this when we switch to a tree
        // decorating strategy is to decorate the tree with the symbol
        // information, so that resolution is done before evaluation. This will
        // simplify and unify the code.
        //
        // For now, using globals is fine, but we should switch to a tree
        // decorating strategy when we have time.

    }
    return column_tables;

}
