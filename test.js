const levels = [
    { id: 0, uid: 0, level: "The Desert"},
    { id: 1, uid: 1, level: "Forest of the Dead"},
    { id: 2, uid: 2, level: "Inner Sanctum"},
];

const characters = [
    { id: 1, actor: "Solid Snake"},
    { id: 2, actor: "James Bond"},
    { id: 3, actor: "Kirby"},
    { id: 4, actor: "Fox McCloud"},
];

const players = [
    { id: 1, name: "Ayden", age: 9 },
    { id: 4, name: "Brandon", age: 10 },
    { id: 3, name: "Catherine", age: 16 },
    { id: 2, name: "Dani", age: 22 },
];

//console.log(
//    "SELECT id FROM levels\n",
//    levels.map(u => u.id),
//    "\n",
//);
//
//console.log(
//    "SELECT id FROM levels WHERE id = 1\n",
//    levels.filter(u => u.id === 1).map(u => u.id),
//    "\n",
//);
//
//console.log(
//    "SELECT * FROM levels, characters\n",
//    levels.map(u => characters.map(a => ({ ...u, ...a }))).flat(),
//    "\n",
//);
//
//console.log(
//    "SELECT * FROM levels, characters WHERE levels.id = 1\n",
//    levels.filter(u => u.id === 1).map(u => characters.map(a => ({ ...u, ...a }))).flat(),
//    "\n",
//);
//
//console.log(
//    "SELECT * FROM levels, characters WHERE levels.id = 1 AND characters.id = 'A'\n",
//    levels.filter(u => u.id === 1).map(u => characters.filter(a => a.id === 'A').map(a => ({ ...u, ...a }))).flat(),
//    "\n",
//);
//
//console.log(
//    "SELECT * FROM levels JOIN characters ON levels.id = characters.id\n",
//    levels.map(u => characters.filter(a => a.id === u.id).map(a => ({ ...u, ...a }))).flat(),
//    "\n",
//);


function cartesian(tables) {
    if (!Object.keys(tables).length)
        return tables;

    const [tname, trows] = tables[0];
    const joined = cartesian
    for (const row of trows) {
        // TODO
    }
}

const str = `
SELECT * 
    FROM levels, actors, players 
WHERE levels.level = 'Inner Sanctum'
    AND players.age > 10 
    AND characters.actor = 'Solid Snake'
`;

for (const row of cartesian(levels, actors, players)) {
}

