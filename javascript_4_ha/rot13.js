var CODE_A = 'a'.charCodeAt(0);
function rot13(str) {
    var codes = [];
    for(var i=0; i<str.length; i++) {
        var ch = str.charAt(i);
        if (! ('a' <= ch && ch <= 'z')) {
            throw new Error('Only characters from a-z are allowed: '+ch+', index '+i);
        }
        var code = str.charCodeAt(i);
        codes.push((((code-CODE_A)+13)%26) + CODE_A);
    }
    return String.fromCharCode.apply(null, codes);
}

module.exports = rot13;