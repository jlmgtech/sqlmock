module.exports = function cartesian(tables) {
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
        if (!data) {
            console.trace();
        }
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

};
