const {get, set} = require("./globals.js");

module.exports = function evaluate_function(evaluate, ast) {
    return row => {
        const name = ast.name;
        const args = evaluate(ast.args);
        const over = ast.over;
        if (over) {
            throw new Error("OVER not supported");
        }
        const func = builtin_functions[name] ?? get("functions")[name];
        if (!func) {
            throw new Error(`Function ${name} not found`);
        }
        return func(...args().map(arg => arg(row)));
    };
};



const builtin_functions = {

    /// count the number of bits in the argument
    BIT_COUNT: (...args) => {
        if (args.length !== 1) {
            throw new Error("BIT_COUNT requires exactly one argument");
        }

        const arg = args[0];
        if (typeof arg !== "number") {
            throw new Error(`BIT_COUNT requires a number, received "${typeof arg}"`);
        }

        let sum = 0;
        for (let i = 0; i < 32; i++) {
            sum += arg >> i & 1;
        }
        return sum;
    },

};
