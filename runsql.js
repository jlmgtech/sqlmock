const {Parser} = require("node-sql-parser");
const evaluate = require("./evaluate.js");
const parser = new Parser();
module.exports = function runsql(sql, database) {
    const ast = parser.parse(sql);
    const strategy = evaluate(database)(ast);
    return strategy();
};
