const runsql = require("./src/runsql.js");
const fs = require("fs");
const express = require("express");
const app = express();
const PORT = 2069;

// curl "http://127.0.0.1/query/SELECT%20name%20FROM%20users/

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


// for testing MySQL behavior ONLINE:
// https://onecompiler.com/mysql/3z8ykhufy

// DONE - SELECT
// DONE - INSERT
// DONE - UPDATE
// DONE - DELETE
// TODO - GROUP BY
// TODO - subqueries 
// Subqueries are used only within "IN" expressions, which means that the
// result of a select statement executed within should yield the same type of
// list as an expr list e.g. `(1, 2, 3)`. You will just need to write some
// custom handling to accomodate that.
//
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
