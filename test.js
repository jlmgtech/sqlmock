const {Parser} = require("node-sql-parser/build/mysql");
const evaluate = require("./evaluate.js");
const md5 = require('md5');
const parser = new Parser();

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

const database = {

    levels: [
        { id: 0, uid: 0, level: "The Desert"},
        { id: 1, uid: 1, level: "Forest of the Dead"},
        { id: 2, uid: 2, level: "Inner Sanctum"},
    ],

    characters: [
        { id: 1, actor: "Solid Snake"},
        { id: 2, actor: "James Bond"},
        { id: 3, actor: "Kirby"},
        { id: 4, actor: "Fox McCloud"},
    ],

    players: [
        { id: 1, name: "Ayden", age: 9 },
        { id: 4, name: "Brandon", age: 10 },
        { id: 3, name: "Catherine", age: 16 },
        { id: 2, name: "Dani", age: 22 },
    ],

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
