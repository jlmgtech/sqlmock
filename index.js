const {parse, stringify} = require("node-sqlparser");
const md5 = require('md5');

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

    actors: [
        {id: 0, fname: null, lname: null},
        {id: 1, fname: "John", lname: "Doe"},
        {id: 2, fname: "Jane", lname: "Doe"},
        //{id: 3, fname: "John", lname: "Smith"},
        //{id: 4, fname: "Jane", lname: "Smith"},
        //{id: 5, fname: "Sarah", lname: "Connor"},
        //{id: 6, fname: "John", lname: "Connor"},
        //{id: 7, fname: "Peter", lname: "Parker"},
        //{id: 8, fname: "Mary", lname: "Jane"},
        //{id: 9, fname: "Tony", lname: "Stark"},
        //{id: 10, fname: "Bruce", lname: "Wayne"},
        //{id: 11, fname: "Clark", lname: "Kent"},
        //{id: 12, fname: "Bruce", lname: "Banner"},
        //{id: 13, fname: "Peter", lname: "Quill"},
        //{id: 15, fname: "David", lname: "Hayter"},
        //{id: 16, fname: "Hideo", lname: "Kojima"},
        //{id: 17, fname: "Snake", lname: "Plissken"},
        //{id: 18, fname: "Big", lname: "Boss"},
        //{id: 19, fname: "John", lname: "Rambo"},
        //{id: 20, fname: "John", lname: "McClane"},
        //{id: 21, fname: "Thomas", lname: "Anderson"},
        //{id: 22, fname: "John", lname: "Matrix"},
        //{id: 23, fname: "John", lname: "Travolta"},
        //{id: 24, fname: "Samuel", lname: "Jackson"},
        //{id: 25, fname: "Bruce", lname: "Willis"},
        //{id: 26, fname: "Arnold", lname: "Schwarzenegger"},
        //{id: 27, fname: "Sylvester", lname: "Stallone"},
        //{id: 28, fname: "Bruce", lname: "Lee"},
        //{id: 29, fname: "Chuck", lname: "Norris"},
        //{id: 30, fname: "Jean-Claude", lname: "Van Damme"},
        //{id: 31, fname: "Steven", lname: "Seagal"},
        //{id: 32, fname: "Jackie", lname: "Chan"},
        //{id: 33, fname: "Jet", lname: "Li"},
        //{id: 34, fname: "Keanu", lname: "Reeves"},
        //{id: 35, fname: "Dolph", lname: "Lundgren"},
        //{id: 36, fname: "Jason", lname: "Statham"},
        //{id: 37, fname: "Vin", lname: "Diesel"},
        //{id: 38, fname: "Paul", lname: "Walker"},
        //{id: 39, fname: "Michelle", lname: "Rodriguez"},
        //{id: 40, fname: "Charlize", lname: "Theron"},
        //{id: 41, fname: "Uma", lname: "Thurman"},
        //{id: 42, fname: "Dwayne", lname: "Johnson"},
        //{id: 43, fname: "Zoe", lname: "Saldana"},
        //{id: 44, fname: "Chris", lname: "Hemsworth"},
        //{id: 45, fname: "Chris", lname: "Evans"},
        //{id: 46, fname: "Scarlett", lname: "Johansson"},
        //{id: 47, fname: "Robert", lname: "Downey Jr."},
        //{id: 48, fname: "Chris", lname: "Pratt"},
        //{id: 49, fname: "Bradley", lname: "Cooper"},
        //{id: 50, fname: "Jennifer", lname: "Lawrence"},
        //{id: 51, fname: "Benedict", lname: "Cumberbatch"},
        //{id: 52, fname: "Tom", lname: "Holland"},
        //{id: 53, fname: "Tom", lname: "Hardy"},
        //{id: 54, fname: "Chadwick", lname: "Boseman"},
        //{id: 55, fname: "Mark", lname: "Ruffalo"},
    ]
};


function evaluate(ast) {
    if (!ast) {
        return null;
    }

    switch (ast.type) {

        case "select": {
            const tables = ast.from;
            const filter = evaluate(ast.where);
            const offset = null; // TODO
            const map    = ast.columns === "*" ?
                (a => a) :
                (a => ast.columns.map(c => a[c.column]));

            const orderby = ast.orderby ? ast.orderby.map(evaluate)[0] : null;
            const limit   = ast.limit ? ast.limit.map(evaluate) : null;

            return () => {
                // performing a cross join of the relevant tables:
                let joined = cartesian(database);
                //if (columns_use_as) {
                //    joined = joined.map(row => ({...row, actors: {...row.actors, first: row.actors.fname}}))
                //}

                if (filter) {
                    // filtering using "where" or "on":
                    //joined = joined.filter(row => row.users.name === "John Doe" && row.actors.fname === "John")
                    joined = joined.filter(filter);
                }
                if (orderby) {
                    joined = joined.sort(orderby);
                }
                if (offset) {
                    joined = joined.slice(...limit);
                }
                if (limit) {
                    joined = joined.slice(0, ...limit);
                }

                // combine tables into single output object:
                const result = joined.map(row => 
                    Object.assign([], ...Object.values(row)));

                return result;

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
            const rhs = evaluate(ast.right);
            switch (ast.operator) {
                case "LIKE": {
                    const expr = rhs
                        .replace(/%/g, ".*")
                        .replace(/_/g, ".")
                        .replace(/\\/g, "\\\\");
                    const regex = new RegExp(`^${expr}$`);
                    return (row) => regex.test(row[lhs]);
                }
                case "IN": {
                    return (row) => rhs.includes(row[lhs]);
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
            return () => ast.value;
        }
        case "ASC": {
            // return sorting comparator; only one column supported for now
            const column = evaluate(ast.expr);
            return (a, b) => a[column] < b[column] ? -1 : 1;
        }
        case "DESC": {
            const column = evaluate(ast.expr);
            return (a, b) => a[column] > b[column] ? -1 : 1;
        }
        case "number": {
            return () => ast.value;
        }
        case "expr_list": {
            return ast.value.map(evaluate);
        }
        default:
            console.error("ERROR:", ast);
            throw new Error(`"${ast.type}" is not implemented`);

    }

}

//console.info(sql);
//console.log(JSON.stringify(ast, null, 2));
const test_queries = [
    ["SELECT * FROM actors, users WHERE actors.fname = 'John'", ""],
    //["SELECT * FROM actors JOIN users ON true", "2042399481af5f1ba0f9af04ac7e9f33"],
    //["SELECT * FROM actors, users", ""],
    //"SELECT * FROM actors JOIN users on users.actorid = actors.id WHERE actors.fname LIKE '%'",
    //"SELECT * FROM actors WHERE fname LIKE 'C%'",
    //"SELECT * FROM actors WHERE fname LIKE 'J%' AND lname IN('Doe', 'Smith')",
    //"SELECT * FROM actors WHERE fname LIKE 'J%' AND lname IN('Doe', 'Smith') ORDER BY fname",
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
    const ast = parse(query);
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


// TODO - JOIN: 
// SELECT Orders.CustomerID, Customers.CustomerID FROM Orders INNER JOIN Customers ON Orders.CustomerID <= Customers.CustomerID;
// https://www.w3schools.com/sql/trysql.asp?filename=trysql_select_join_inner
//
// TODO - Select from multiple tables (kinda the same as an inner join where the "on" condition is always true)
// SELECT count(*) FROM actors, users; (you'll get length of actors * length of users)
//
// TODO - subqueries NOTE: subqueries are not supported by the parser!
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
