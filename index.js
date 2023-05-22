const {Parser} = require("node-sql-parser/build/mysql");
const md5 = require('md5');
const parser = new Parser();

// NEXT TODO: order by 2023-05-19

// for testing MySQL behavior ONLINE:
// https://onecompiler.com/mysql/3z8ykhufy

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

const schema = {
    users: {
        id: "number",
        actorid: "number",
        name: "string",
    },

    actors: {
        id: "number",
        fname: "string",
        lname: "string",
        name: "string",
    },

    silos: {
        id: "number",
        name: "string",
    },
};


// notes:
`
SELECT id FROM users;
users   .map(u => u.id);

SELECT id FROM users WHERE id = 1;
users   .filter(u => u.id === 1)
        .map(u => u.id);

SELECT id FROM users WHERE id = 1 AND name = 'foo';
users   .filter(u => u.id === 1)
        .filter(u.name === 'foo')
        .map(u => u.id);

SELECT * FROM users;
users   .map(u => u);

SELECT * FROM users, actors;
 users  .map(u => actors.map(a => ({...u, ...a})))
        .reduce((a, b) => a.concat(b), []);

SELECT * FROM users, actors WHERE users.id = actors.user_id;
users   .map(u => actors.filter(a => a.user_id === u.id).map(a => ({...u, ...a})))
        .reduce((a, b) => a.concat(b), []);

SELECT * FROM users JOIN actors on users.id = actors.user_id;
users   .map(u => actors.filter(a => a.user_id === u.id).map(a => ({...u, ...a})))
        .reduce((a, b) => a.concat(b), [])
`;

const database = {

    users: [
        {id: 0, actorid: 1, name: "John Doe"},
        {id: 1, actorid: 2, name: "Jane Doe"},
        {id: 3, actorid: 4, name: "Jane Smith"},
    ],

    silos: [
        {id: 0, name: "missile 1"},
    ],

    actors: [
        {id: 0, name: null, fname: null, lname: null},
        {id: 1, name: "John Doe", fname: "John", lname: "Doe"},
        {id: 2, name: "Jane Doe", fname: "Jane", lname: "Doe"},
        {id: 3, name: "John Smith", fname: "John", lname: "Smith"},
        {id: 4, name: "Jane Smith", fname: "Jane", lname: "Smith"},
        {id: 5, name: "Sarah Connor", fname: "Sarah", lname: "Connor"},
        {id: 6, name: "John Connor", fname: "John", lname: "Connor"},
        {id: 7, name: "Peter Parker", fname: "Peter", lname: "Parker"},
        {id: 8, name: "Mary Jane", fname: "Mary", lname: "Jane"},
        {id: 9, name: "Tony Stark", fname: "Tony", lname: "Stark"},
        {id: 10, name: "Bruce Wayne", fname: "Bruce", lname: "Wayne"},
        {id: 11, name: "Clark Kent", fname: "Clark", lname: "Kent"},
        {id: 12, name: "Bruce Banner", fname: "Bruce", lname: "Banner"},
        //{id: 13, name: "Peter Quill", fname: "Peter", lname: "Quill"},
        //{id: 15, name: "David Hayter", fname: "David", lname: "Hayter"},
        //{id: 16, name: "Hideo Kojima", fname: "Hideo", lname: "Kojima"},
        //{id: 17, name: "Snake Plissken", fname: "Snake", lname: "Plissken"},
        //{id: 18, name: "Big Boss", fname: "Big", lname: "Boss"},
        //{id: 19, name: "John Rambo", fname: "John", lname: "Rambo"},
        //{id: 20, name: "John McClane", fname: "John", lname: "McClane"},
        //{id: 21, name: "Thomas Anderson", fname: "Thomas", lname: "Anderson"},
        //{id: 22, name: "John Matrix", fname: "John", lname: "Matrix"},
        //{id: 23, name: "John Travolta", fname: "John", lname: "Travolta"},
        //{id: 24, name: "Samuel Jackson", fname: "Samuel", lname: "Jackson"},
        //{id: 25, name: "Bruce Willis", fname: "Bruce", lname: "Willis"},
        //{id: 26, name: "Arnold Schwarzenegger", fname: "Arnold", lname: "Schwarzenegger"},
        //{id: 27, name: "Sylvester Stallone", fname: "Sylvester", lname: "Stallone"},
        //{id: 28, name: "Bruce Lee", fname: "Bruce", lname: "Lee"},
        //{id: 29, name: "Chuck Norris", fname: "Chuck", lname: "Norris"},
        //{id: 30, name: "Jean-Claude Van Damme", fname: "Jean-Claude", lname: "Van Damme"},
        //{id: 31, name: "Steven Seagal", fname: "Steven", lname: "Seagal"},
        //{id: 32, name: "Jackie Chan", fname: "Jackie", lname: "Chan"},
        //{id: 33, name: "Jet Li", fname: "Jet", lname: "Li"},
        //{id: 34, name: "Keanu Reeves", fname: "Keanu", lname: "Reeves"},
        //{id: 35, name: "Dolph Lundgren", fname: "Dolph", lname: "Lundgren"},
        //{id: 36, name: "Jason Statham", fname: "Jason", lname: "Statham"},
        //{id: 37, name: "Vin Diesel", fname: "Vin", lname: "Diesel"},
        //{id: 38, name: "Paul Walker", fname: "Paul", lname: "Walker"},
        //{id: 39, name: "Michelle Rodriguez", fname: "Michelle", lname: "Rodriguez"},
        //{id: 40, name: "Charlize Theron", fname: "Charlize", lname: "Theron"},
        //{id: 41, name: "Uma Thurman", fname: "Uma", lname: "Thurman"},
        //{id: 42, name: "Dwayne Johnson", fname: "Dwayne", lname: "Johnson"},
        //{id: 43, name: "Zoe Saldana", fname: "Zoe", lname: "Saldana"},
        //{id: 44, name: "Chris Hemsworth", fname: "Chris", lname: "Hemsworth"},
        //{id: 45, name: "Chris Evans", fname: "Chris", lname: "Evans"},
        //{id: 46, name: "Scarlett Johansson", fname: "Scarlett", lname: "Johansson"},
        //{id: 47, name: "Robert Downey Jr.", fname: "Robert", lname: "Downey Jr."},
        //{id: 48, name: "Chris Pratt", fname: "Chris", lname: "Pratt"},
        //{id: 49, name: "Bradley Cooper", fname: "Bradley", lname: "Cooper"},
        //{id: 50, name: "Jennifer Lawrence", fname: "Jennifer", lname: "Lawrence"},
        //{id: 51, name: "Benedict Cumberbatch", fname: "Benedict", lname: "Cumberbatch"},
        //{id: 52, name: "Tom Holland", fname: "Tom", lname: "Holland"},
        //{id: 53, name: "Tom Hardy", fname: "Tom", lname: "Hardy"},
        //{id: 54, name: "Chadwick Boseman", fname: "Chadwick", lname: "Boseman"},
        //{id: 55, name: "Mark Ruffalo", fname: "Mark", lname: "Ruffalo"},
    ]
};


let FROM_TABLES = [];

function evaluate(ast) {
    if (!ast) {
        return null;
    }

    switch (ast.type) {

        case "select": {
            const from_tables = ast.from.map(f => f.table);
            FROM_TABLES = from_tables;
            const filter = evaluate(ast.where);
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

            const orderby = ast.orderby ? ast.orderby.map(evaluate) : null;

            const limit   = ast.limit ? ast.limit.map(evaluate) : null;

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
                    // filtering using "where" or "on":
                    //joined = joined.filter(row => row.users.name === "John Doe" && row.actors.fname === "John")
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
                //const result = joined.map(row => 
                //    Object.assign([], ...Object.values(row)));

                //return result;

                //const results = {};
                //for (const table of tables) {
                //    const outname = table.as ?? table.table;
                //    results[outname] = database[table.table];
                //    if (filter) {
                //        results[outname] = results[outname].filter(filter);
                //    }
                //    if (map) {
                //        results[outname] = results[outname].map(map);
                //    }
                //    if (orderby) {
                //        results[outname] = results[outname].sort(orderby);
                //    }
                //    if (limit) {
                //        results[outname] = results[outname].slice(...limit);
                //    }
                //}

                //    // do a cross join by producing the cartesian product of all
                //    // the tables. If the join is an inner join, then we can
                //    // simply filter the results using the "ON" predicate.

                //    // create a cartesian product of the results
                //    // https://stackoverflow.com/a/43053803/1123955
                //    const keys = Object.keys(results);
                //    const values = keys.map(k => results[k]);
                //    //const cartesian = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));

                //    const cartesianProduct = values.reduce(cartesian);

                //    // flatten the cartesian product
                //    // https://stackoverflow.com/a/10865042/1123955
                //    const flatten = (a, b) => a.concat(b);
                //    const flattened = cartesianProduct.reduce(flatten, []);

                //    return flattened;
            };

        }

        case "null": {
            return null;
        }

        case "binary_expr": {

            const lhs = evaluate(ast.left);
            if (typeof lhs !== "function") {
                throw new TypeError(`lhs needs to be a function for '${ast.left.type}' node`);
            }

            const rhs = evaluate(ast.right);
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
            //const column = evaluate(ast.expr);
            if (!ast.expr.table && FROM_TABLES.length > 1) {
                throw new Error(`Cannot ORDER BY ambiguous table '${ast.expr.table}'`);
            }
            const table = ast.expr.table || FROM_TABLES[0];
            return row => (a, b) => a[table][ast.expr.column] < b[table][ast.expr.column] ? -1 : 1;
        }
        case "DESC": {
            const column = evaluate(ast.expr);
            return (a, b) => a[column] > b[column] ? -1 : 1;
        }
        case "number": {
            return () => ast.value;
        }
        case "expr_list": {
            return () => ast.value.map(evaluate);
        }
        case "single_quote_string": {
            return () => ast.value;
        }
        default:
            if (!ast.type && ast.ast) {
                // probably a select statement:
                return evaluate(ast.ast);
            } else {
                console.error("ERROR:", ast);
                throw new Error(`"${ast.type}" is not implemented`);
            }

    }

}

const test_queries = [
    // simple queries and joins:
    ["SELECT fname FROM actors", ""],
    ["SELECT actors.name as actor_name, actors.fname, users.name FROM actors, users WHERE actors.fname = 'John'", ""],
    ["SELECT actors.fname, users.name as username FROM actors JOIN users ON true", "2042399481af5f1ba0f9af04ac7e9f33"],
    ["SELECT actors.id as actor, users.id as user FROM actors, users", ""],

    //// testing binary operators:
    ["SELECT * FROM actors WHERE fname LIKE 'John'", ""],
    ["SELECT * FROM actors WHERE fname LIKE 'J%'", ""],
    ["SELECT * FROM actors WHERE fname IN ('John', 'Jane')", ""],

    ["SELECT * FROM actors WHERE fname IN ('John', actors.lname)", ""],

    ////Subqueries are now supported, but we need to reorganize the data that
    //comes back from processing a select statement.
    //["SELECT fname FROM actors WHERE fname IN (SELECT `fname` FROM `actors`)", ""],

    ["SELECT users.actorid, actors.id FROM actors JOIN users on users.actorid = actors.id WHERE actors.fname LIKE '%'", ""],
    ["SELECT * FROM actors WHERE fname LIKE 'C%'", ""],
    ["SELECT * FROM actors WHERE fname LIKE 'J%' AND lname IN('Doe', 'Smith')", ""],
    ["SELECT fname, lname FROM actors WHERE fname ORDER BY fname, lname", ""],
    //"SELECT * FROM actors WHERE fname LIKE 'J%' AND lname IN('Doe', 'Smith') ORDER BY fname DESC",
    //"SELECT * FROM actors WHERE fname LIKE 'J%' AND lname IN('Doe', 'Smith') ORDER BY fname DESC LIMIT 2",
    //"SELECT * FROM actors WHERE fname LIKE 'J%' AND lname IN('Doe', 'Smith') ORDER BY fname DESC LIMIT 2, 3",
    //"SELECT * FROM actors WHERE fname = 'Chris'",
    //"SELECT * FROM actors WHERE fname = 'Chris' AND lname = 'Pratt'",
    //"SELECT * FROM actors WHERE fname = 'Chris' AND lname = 'Pratt' OR fname = 'Bradley' AND lname = 'Cooper'",
    //"SELECT * FROM actors WHERE fname > 'J'",
    //"SELECT * FROM actors WHERE fname > 'J' AND lname > 'L'",
    //"SELECT * FROM actors WHERE fname > 'J' AND lname > 'L' ORDER BY fname",
    //"SELECT * FROM actors WHERE fname > 'J' AND lname > 'L' ORDER BY fname DESC",
    //"SELECT * FROM actors WHERE fname > 'J' AND lname > 'L' ORDER BY fname DESC LIMIT 2",
    //"SELECT * FROM actors WHERE fname > 'J' AND lname > 'L' ORDER BY fname DESC LIMIT 2, 3",
    //"SELECT * FROM actors WHERE fname < 'J'",
    //"SELECT * FROM actors WHERE fname < 'J' AND lname < 'L'",
    //"SELECT * FROM actors WHERE fname >= 'Jim'",
    //"SELECT * FROM actors WHERE fname >= 'Jim' AND lname >= 'L'",
    //"SELECT * FROM actors WHERE fname <= 'Jim'",
    //"SELECT * FROM actors WHERE fname <= 'Jim' AND lname <= 'L'",
    //"SELECT * FROM actors WHERE fname <> 'Jim'",
    //"SELECT * FROM actors WHERE fname <> 'Jim' AND lname <> 'L'",
    //"SELECT * FROM actors WHERE fname != 'Jim'",
    //"SELECT * FROM actors WHERE fname != 'Jim' AND lname != 'L'",
    //"SELECT * FROM actors WHERE fname IS NULL",
    //"SELECT * FROM actors WHERE fname != NULL",
    //"SELECT * FROM actors WHERE fname IN ('Jim', 'Chris')",
    //"SELECT * FROM actors WHERE fname IN ('Jim', 'Chris') AND lname IN ('L', 'P')",
    //"SELECT * FROM actors WHERE fname IN ('Jim', 'Chris') AND lname IN ('L', 'P') ORDER BY fname",
    //"SELECT * FROM actors WHERE fname IN ('Jim', 'Chris') AND lname IN ('L', 'P') ORDER BY fname DESC",
    //"SELECT * FROM actors WHERE fname IN ('Jim', 'Chris') AND lname IN ('L', 'P') ORDER BY fname DESC LIMIT 2",
];

for (const [query, expected] of test_queries) {
    const ast = parser.astify(query);
    const strategy = evaluate(ast);
    const result = strategy();
    const checksum = md5(JSON.stringify(result));
    console.log(query);

    if (checksum === expected) {
        console.log("OK");
    } else {
        console.error("FAIL");
        console.error("Expected:", expected);
        console.error("Actual:", checksum);
        console.error("Result:", result);
    }
    console.log("========================================");
    console.log("%d results (users %d, actors %d)", result.length, database.users.length, database.actors.length);
}


// TODO - Select from multiple tables (kinda the same as an inner join where the "on" condition is always true)
// SELECT count(*) FROM actors, users; (you'll get length of actors * length of users)
//
// TODO - subqueries NOTE: subqueries are not supported by the parser!
// I created an issue here: https://github.com/taozhi8833998/node-sql-parser/issues/1430

// TODO - GROUP BY
// TODO - INSERT
// TODO - UPDATE
// TODO - DELETE
// TODO - CREATE TABLE
// TODO - CREATE DATABASE
// TODO - CREATE SCHEMA
// TODO - ALTER TABLE
// TODO - ALTER DATABASE
// TODO - ALTER SCHEMA
// TODO - DROP TABLE
// TODO - DROP INDEX
// TODO - DROP DATABASE
// TODO - DROP SCHEMA
// TODO - REPLACE
// TODO - SHOW
