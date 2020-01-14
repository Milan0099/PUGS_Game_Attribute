module.exports = {
    QueryNotDefined: class QueryNotDefined extends Error {
        constructor(fnName = "") {
            super();
            this.name = "QueryNotDefined";
            this.message = `Query at function ${fnName} cannot be undefined`;
        }
    },
    CallbackNotDefined: class CallbackNotDefined extends Error {
        constructor(fnName = "") {
            super();
            this.name = "CallbackNotDefined";
            this.message = `Callback at function ${fnName} cannot be undefined`;
        }
    }
}