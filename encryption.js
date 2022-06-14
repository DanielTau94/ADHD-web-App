const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
//const key = crypto.randomBytes(32);
const key = "very_very_secret_key";
const iv = crypto.randomBytes(16);


function encrypt(text) {
    //console.log("to encrypt: " + text)
    crypto.createHash
    var mykey = crypto.createCipher(algorithm, key);
    var mystr = mykey.update(text, 'utf8', 'hex')
    mystr += mykey.final('hex');
    return mystr;
}


function decrypt(text) {
    //console.log("to decrypt: " + text);
    var mykey = crypto.createDecipher(algorithm, key);
    var mystr = mykey.update(text, 'hex', 'utf8')
    mystr += mykey.final('utf8');
    return mystr;
}
 
module.exports.encrypt = encrypt;
module.exports.decrypt = decrypt;