const runsql = require("./runsql.js");
const fs = require("fs");
const express = require("express");
const app = express();
const PORT = 2069;

// TODO - SELECT 1 should work as a hello world
// Run the server (node .)
// Then curl "http://127.0.0.1/query/SELECT%201/

// load the database file:
const db = JSON.parse(fs.readFileSync("./database.json", {encoding:"utf-8"}));


const jsonErrorHandler = (err, req, res, next) => {
    res.status(500).json({ error: err });
}

//app.use(bodyParser.json());
app.use(jsonErrorHandler);

// now listen for requests
app.get("/query/:query", (request, response) => {
    try {
        const sql = request.params.query;
        const result = runsql(sql, db);
        console.log("result: ", result)
        response.json({
            type: "result",
            result
        });
    } catch(e) {
        response.json({
            type: "error",
            message: `${e}`,
        });
    }
});

app.listen(PORT, () => {
    console.log("SQL Mock Server Listening (port %d)", PORT);
    console.log("use: GET /query/<query_string>");
});


const sql = "SELECT name FROM users";
console.log(db.__schema__);
const result = runsql(sql, db);
console.log("result: ", result)

// for testing MySQL behavior ONLINE:
// https://onecompiler.com/mysql/3z8ykhufy

// TODO - subqueries 
// Subqueries are used only within "IN" expressions, which means that the
// result of a select statement executed within should yield the same type of
// list as an expr list e.g. `(1, 2, 3)`. You will just need to write some
// custom handling to accomodate that.

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
