const cartesian = require("./cartesian.js");
function get_sassy_remark() {
    const idx = Math.floor(Math.random() * 20);
    return sassy_remarks[idx];
}

module.exports = function evaluate_delete(evaluate, database, ast) {

    if (ast.with)
        throw new Error("DELETE - WITH is not supported");
    if (ast.orderby)
        throw new Error("DELETE doesn't support ORDER BY");
    if (ast.limit)
        throw new Error("DELETE doesn't support LIMIT yet");

    if (!ast.table)
        throw new Error("Cannot DELETE from an empty table");
    if (ast.table.length !== 1)
        throw new Error("Must DELETE from exactly ONE table.");
    const table = ast.table[0];
    if (table.db)
        throw new Error("DELETE - database selection is prohibited.");
    if (table.as)
        throw new Error("DELETE - table aliases are not supported.");

    if (!ast.from)
        throw new Error("DELETE - you must specify a table to delete from");
    if (ast.from.length !== 1)
        throw new Error("DELETE - you must DELETE from exactly one table");
    const from = ast.from[0];
    if (from.db)
        throw new Error("DELETE - selecting a database to delete from is prohibited");
    if (from.table !== table.table)
        throw new Error("DELETE - " + get_sassy_remark());

    if (!ast.where)
        throw new Error("You are required to specify a WHERE clause for all DELETE operations");

    const tname = from.table;
    const schema = database.__schema__;

    // now validate against the schema
    // first, check if the table exists
    if (!schema[tname])
        throw new Error("DELETE - table " + tname + " does not exist");

    return () => {

        const data = {};
        data[tname] = database[tname];
        const rows = cartesian(data);

        // delete from users where thing like '%' or that like '%'
        const whereFilter = evaluate(database)(ast.where);
        const replacement = [];
        let rowsdeleted = 0;
        for (const row of rows) {
            if (!whereFilter(row)) {
                replacement.push(row);
            } else {
                rowsdeleted++;
            }
        }
        database[tname] = replacement;
        return rowsdeleted;

    };
};

const sassy_remarks = [
    "Hold on, SQL Einstein! No need to overcomplicate a simple DELETE statement.",
    "Did you bring your fancy DELETE syntax to impress the database? Sorry, not impressed!",
    "Hey there, SQL Picasso! But let's keep the DELETE operations as simple as a stick figure, shall we?",
    "Oh, look who's trying to reinvent the DELETE wheel with their advanced skills! Nice try!",
    "Did you forget that 'DELETE FROM basic_manners' is the preferred command here?",
    "Are you trying to write a DELETE statement or a work of art? Keep it simple!",
    "Seems like you've mastered the art of making DELETE statements complicated. Congratulations!",
    "Ah, the advanced DELETE syntax. Just what we needed said no one ever.",
    "Whoa, slow down! DELETE statements are not a contest for the most complex code.",
    "DELETE like a normal person or DELETE like a superstar. Your choice!",
    "Thinking of a DELETE statement as a puzzle? Well, here's a hint: keep it simple!",
    "DELETE operations made easy. That's our motto, in case you missed it.",
    "Deleting rows with style? Sorry, we're only accepting plain and simple DELETE statements.",
    "Looking for a DELETE magic show? Sorry, we only perform basic tricks here.",
    "Remember, simplicity is the ultimate sophistication... even in DELETE statements.",
    "Save the fancy DELETE syntax for your personal projects. Here, we like it simple.",
    "Calling all SQL divas! We're looking for basic DELETE operations, not a showstopper.",
    "No need to bring out the big guns for a simple DELETE task. Keep it light and easy.",
    "Who needs advanced DELETE syntax when you can achieve greatness with simplicity?",
    "Your advanced DELETE syntax may be impressive, but we prefer a more down-to-earth approach.",
];

