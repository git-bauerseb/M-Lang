const InputStream = require('./stream.js');

module.exports = class TokenStream {

    constructor(stream) {
        this.inputStream = stream;
        this.current = null;
        this.keywords = " if then else lambda true false while ";
    }

    is_whitespace(ch) {
        return ' \n\t'.indexOf(ch) >= 0;
    }

    is_digit(ch) {
        return /[0-9]/.test(ch);
    }

    is_identifier(ch) {
        return /[a-z_]/i.test(ch);
    }

    is_keyword(s) {
        return this.keywords.indexOf(" " + s + " ") >= 0;

    }

    is_op_char(ch) {
        return "+-*/%=&|<>!".indexOf(ch) >= 0;
    }

    is_punc(ch) {
        return ",;(){}[]".indexOf(ch) >= 0;
    }

    read_while(predicate) {
        

        let read = "";

        while (!this.inputStream.eof() &&
             predicate(this.inputStream.peek())) {
            read += this.inputStream.next();
        }

        return read;
    }

    read_next() {

        this.read_while(this.is_whitespace);
        if (this.inputStream.eof()) {return null;}

        let read = this.inputStream.peek();

        // Skip comments
        if (read == '#') {
            this.skip_line_comment();
            return this.read_next();
        }

        // Return a string
        if (read == '"') {
            return this.read_string();
        }

        // Return number
        if (this.is_digit(read)) {
            return this.read_number();
        }

        // Return identifier
        if (this.is_identifier(read)) {
            return this.read_identifier();
        }

        // Return punctation
        if (this.is_punc(read)) {
            return {
                type: "punc",
                value: this.inputStream.next()
            }
        }

        // Operator
        if (this.is_op_char(read)) {
            return {
                type: "op",
                value: this.read_while(this.is_op_char)
            };
        }

        this.inputStream.croak('Invalid character found: ' + read);
    }

    read_identifier() {
        let id = this.read_while(x => this.is_identifier(x));

        return {
            type: this.is_keyword(id) ? "kw" : "var",
            value: id
        };
    }

    read_number() {
        let num = this.read_while((x) => this.is_digit(x));

        return {type: "num", value: parseFloat(num)};
    }

    read_string() {
        this.inputStream.next();
        let s = this.read_while((x) => x != '"');
        
        if (this.inputStream.peek() != '"') {
            this.inputStream.croak('Unterminated string!');
            return null;
        }
        
        this.inputStream.next();

        return {
            type : "str",
            value : s
        };
    }

    skip_line_comment() {
        this.read_while((x) => x != '\n');
        this.inputStream.next();
    }

    peek() {
        return this.current 
            || (this.current = this.read_next());
    }

    next() {
        let tok = this.current;
        this.current = null;
        return tok || this.read_next();
    }

    eof() {
        return this.peek() == null;
    }
}