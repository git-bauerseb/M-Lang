const InputStream = require('./stream.js');
const TokenStream = require('./token.js');

module.exports = class Parser {

    constructor(tokenStream) {
        this.tokenStream = tokenStream;
        this.FALSE = {type: 'bool', value: false};
        this.PRECEDENCE = {
            "=": 1,
            "||": 2,
            "&&": 3,
            "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
            "+": 10, "-": 10,
            "*": 20, "/": 20, "%": 20,
        };
    }

    parse_lambda() {
        return {
            type: "lambda",
            vars: this.delimited('(', ')', ',', () => this.parse_varname()),
            body: this.parse_expression()
        };
    }

    parse_varname() {
        let name = this.tokenStream.next();
        if (name.type != 'var') {
            throw Error('Expecting variable name');
        }

        return name.value;
    }

    parse_toplevel() {
        let prog = [];

        while (!this.tokenStream.eof()) {
            prog.push(this.parse_expression());
            if (!this.tokenStream.eof()) {
                this.skip_punc(';');
            }
        }

        return {type: "prog", prog: prog};
    }

    parse_prog() {
        let prog = this.delimited('{', '}', ';', () => this.parse_expression());
        if (prog.length == 0) {
            return this.FALSE;
        }

        if (prog.length == 1) {
            return prog[0];
        }

        return {type: 'prog', prog: prog};
    }

    parse_expression() {

        let m = this.maybe_binary(this.parse_atom(), 0);

        return this.maybe_call(function() {
            return m;
        });
    }

    maybe_call(expr) {
        expr = expr();
        return this.is_punc('(') ? this.parse_call(expr)
            : expr;
    }

    maybe_binary(left, my_prec) {
        let tok = this.is_op();

        if (tok) {
            let his_prec = this.PRECEDENCE[tok.value];

            if (his_prec > my_prec) {
                this.tokenStream.next();
                let right = this.maybe_binary(this.parse_atom(), his_prec);
                let binary = {
                    type : tok.value == '=' ? 'assign' : 'binary',
                    operator: tok.value,
                    left: left,
                    right: right
                };

                return this.maybe_binary(binary, my_prec);
            }
        }

        return left;
    }

    parse_call(func) {
        return {
            type: 'call',
            func: func,
            args: this.delimited('(', ')', ',', () => this.parse_expression())
        }
    }

    parse_if() {
        this.skip_kw('if');

        let cond = this.parse_expression();

        if(!this.is_punc('{')) {
            this.skip_kw('then');
        }
        
        let then = this.parse_expression();

        let ret = {type: 'if', cond: cond, then: then};

        if (this.is_keyword('else')) {
            this.tokenStream.next();
            ret.else = this.parse_expression();
        }

        return ret;
    }

    parse_atom() {
        return this.maybe_call(() => {
            if (this.is_punc('(')) {
                this.tokenStream.next();
                let exp = this.parse_expression();
                this.skip_punc(')');
                return exp;
            }

            if (this.is_punc('{')) return this.parse_prog();
            if (this.is_keyword('if')) return this.parse_if();
            if (this.is_keyword('true') || this.is_keyword('false')) {
                return this.parse_bool();
            }

            if (this.is_keyword('lambda')) {
                this.tokenStream.next();
                return this.parse_lambda();
            }

            let tok = this.tokenStream.next();

            if (tok.type == 'var' || tok.type == 'num' || tok.type == 'str') {
                return tok;
            }

            this.unexpected();
        });
    }

    delimited(start, stop, separator, parser) {
        let a = [];
        let first = true;

        this.skip_punc(start);

        while (!this.tokenStream.eof()) {
            if (this.is_punc(stop)) {break;}
            if (first) {
                first = false;
            } else {
                this.skip_punc(separator);
            }

            if (this.is_punc(stop)) {
                break;
            }

            a.push(parser());
        }

        this.skip_punc(stop);
        return a;
    }

    is_keyword(ch) {
        let cTok = this.tokenStream.peek();
        return cTok.type == 'kw'
            && cTok.value == ch;
    }

    is_punc(ch) {
        var tok = this.tokenStream.peek();
        return tok && tok.type == "punc" && (!ch || tok.value == ch) && tok;
    }

    is_op(op) {
        let tok = this.tokenStream.peek();
        return tok && tok.type == 'op' && (!op || tok.value == op) && tok; 
    }

    skip_kw(ch) {
        if (!this.is_keyword(ch)) {
            throw Error("Expected character " + ch);
        } else {
            this.tokenStream.next();
        }
    }

    skip_punc(ch) {
        if (!this.is_punc(ch)) {
            throw Error("Expected character " + ch);
        } else {
            this.tokenStream.next();
        }
    }
}