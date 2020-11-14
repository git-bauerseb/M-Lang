module.exports = class InputStream {
    
    constructor(input) {

        this.stream = input;
        this.position = 0;
        this.line = 1;
        this.column = 0;

    }

    next() {
        let ch = this.stream.charAt(this.position++);

        if (ch == '\n') {this.line++; this.column = 0;}
        else {
            this.column++;
        }

        return ch;
    }

    peek() {
        return this.stream.charAt(this.position);
    }

    eof() {
        return this.peek() == '';
    }

    croak(msg) {
        throw new Error(msg + ' (' + this.line + ': ' + this.column + ')');
    }
}