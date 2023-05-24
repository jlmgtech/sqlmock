const {Parser} = require("node-sql-parser/build/mysql");
const evaluate = require("../src/evaluate.js");
const fs = require("fs");
const md5 = require('md5');
const parser = new Parser();

const database = JSON.parse(fs.readFileSync("./database.json", {encoding:"utf-8"}));
if (!database) {
    throw new Error("no database found");
}

const test_queries = [

    // this one should check the schema and make sure that the table exists, the columns exist in the table, and 
    // that the types of the columns are correct. Also, it should enforce constraints.
    //["INSERT INTO users(actorid, name) VALUES(1, 'test')", ""],
    //["SELECT * FROM users", ""],

    //next, you should be able to auto-increment the primary key:
    ["UPDATE users SET name = 'test2' WHERE name LIKE 'J%'", ""],
    ["SELECT * FROM users", ""],
    //["UPDATE users SET name = 'test2' WHERE actorid = 1", ""],

    //["SELECT 1"],

    // simple queries and joins:
    //["SELECT fname FROM actors", ""],
    ["SELECT actors.name as actor_name, actors.fname, users.name FROM actors, users WHERE actors.fname = 'John'", ""],
    //["SELECT actors.fname, users.name as username FROM actors JOIN users ON true", "2042399481af5f1ba0f9af04ac7e9f33"],
    //["SELECT actors.id as actor, users.id as user FROM actors, users", ""],

    //// testing binary operators:
    //["SELECT * FROM actors WHERE fname LIKE 'John'", ""],
    //["SELECT * FROM actors WHERE fname LIKE 'J%'", ""],
    //["SELECT * FROM actors WHERE fname IN ('John', 'Jane')", ""],

    //["SELECT * FROM actors WHERE fname IN ('John', actors.lname)", ""],

    ////Subqueries are now supported, but we need to reorganize the data that
    //comes back from processing a select statement.
    //["SELECT fname FROM actors WHERE fname IN (SELECT `fname` FROM `actors`)", ""],

    //["SELECT users.actorid, actors.id FROM actors JOIN users on users.actorid = actors.id WHERE actors.fname LIKE '%'", ""],
    //["SELECT * FROM actors WHERE fname LIKE 'C%'", ""],
    //["SELECT * FROM actors WHERE fname LIKE 'J%' AND lname IN('Doe', 'Smith')", ""],
    //["SELECT fname, lname FROM actors WHERE fname ORDER BY fname, lname", ""],
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
    const strategy = evaluate(database)(ast);
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
