const globals = {};
module.exports = {
    get(name) {
        return globals[name];
    },

    set(name, value) {
        globals[name] = value;
    },
};
