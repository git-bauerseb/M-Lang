const Parser = require('./parser.js');
const InputStream = require('./stream.js');
const TokenStream = require('./token.js');

const fs = require('fs');

/*
    Functions for the environment
*/

function Environment(parent) {
        this.vars = Object.create(parent ? parent.vars : null);
        this.parent = parent;
}

Environment.prototype = {
    extend: function() {
        return new Environment(this);
    },

    lookup: function(name) {
        let scope = this;
        while (scope) {
            if (Object.prototype.hasOwnProperty.call(scope.vars, name)) {
                return scope;
            }

            scope = scope.parent;
        }
    },

    get: function(name) {
        if (name in this.vars) {
            return this.vars[name];
        }

        throw new Error("Undefined variable");
    },

    set: function(name, value) {
        let scope = this.lookup(name);

        if (!scope && this.parent) {
            throw new Error("Undefined variable");
        }

        return (scope || this).vars[name] = value;
    },

    def: function(name, value) {
        return this.vars[name] = value;
    }
};

function num(x) {
    if (typeof x !== 'number') {
        throw new Error(x + ' is not a number');
    } else {
        return x;
    }
}

function div(x) {
    if (typeof x !== 'number' || x == 0) {
        throw new Error(x + ' is an invalid denominator');
    } else {
        return x;
    }
}

function apply_op(op, l, r) {
    switch(op) {
        case '+': return l + r;
        case '-': return num(l) - num(r);
        case '/': return num(l) / div(r);
        case '*': return num(l) * num(r);
        case '<': return l < r;
        case '<=': return l <= r;
        case '>': return l > r;
        case '>=': return l >= r;
        case '==': return l === r;
        case '!=': return l != r;
        case '&&': return l !== false && b;
        case '||': return l !== false ? l : r;
        default:
            throw new Error('Unknown operator');
    }
}

function evaluate(exp, env) {
    switch(exp.type) {

        case 'num':
        case 'str':
        case 'bool':
            return exp.value;

        case 'var':
            return env.get(exp.value);
        case 'assign':
            if (exp.left.type != 'var') {
                throw new Error('Cannot assign');
            }

            return env.set(exp.left.value, evaluate(exp.right, env));

        case 'binary':
            return apply_op(exp.operator, evaluate(exp.left, env),
                evaluate(exp.right, env));

        case 'while':
            var ret = false;
            while (evaluate(exp.cond, env)) {
                ret = evaluate(exp.body, env);
            }
            return ret;

        case 'if':
            let cond = evaluate(exp.cond, env);
            if (cond) {
                return evaluate(exp.then, env);
            }

            return exp.else ? evaluate(exp.else, env) : false;

        case 'prog':
            let val = false;
            exp.prog.forEach((ex) => {val = evaluate(ex, env);});
            return val;
        case 'lambda':
            return make_lambda(exp, env);
        case 'call':
            let func = evaluate(exp.func, env);
            return func.apply(null, exp.args.map((arg) => {return evaluate(arg, env)}));
        default:
            throw new Error('Dont know how to evaluate');
    }
}

function make_lambda(exp, env) {
    function lambda() {
        let names = exp.vars;
        let scope = env.extend();

        for (let i = 0; i < names.length; ++i) {
            scope.def(names[i], i < arguments.length ? arguments[i] : false);
        }

        return evaluate(exp.body, scope);
    }

    return lambda;
}

function test(file) {
    fs.readFile(file, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return;
        } else {
            stream = new InputStream(data);
            tokenStream = new TokenStream(stream);
            parser = new Parser(tokenStream);

            let parsedInput = parser.parse_toplevel();

            evaluate(parsedInput, globalEnv);
        }
    });
}

let globalEnv = new Environment();
globalEnv.def('print', function(txt) {
    console.log(txt);
});

globalEnv.def('length', function(str) {
    if (typeof str !== 'string') {
        throw new Error('Cannot compute length of non string');
    } else {
        return str.length;
    }
});

globalEnv.def('write', function(path, str) {
    fs.writeFile(path, str, {flag:'w+'}, err => {});
});

function main() {
    test(process.argv[2]);
}

main();