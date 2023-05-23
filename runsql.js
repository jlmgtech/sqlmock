const evaluate = require("./evaluate.js");
module.exports = function runsql(sql, database) {
    return evaluate(database)(sql);
};
