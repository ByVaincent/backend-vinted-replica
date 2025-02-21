const uid2 = require("uid2/promises");
const sha256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

//encrypting function : return an object with hash and salt properties
const encryptingFunction = async (passwordToEncrypt) => {
  const salt = await uid2(16);

  const hash = sha256(passwordToEncrypt + salt).toString(encBase64);

  return { hash, salt };
};

//decrypting function, return true if match
const decryptingFunction = (passwordToCheck, salt, hash) => {
  const saltedPass = passwordToCheck + salt;

  const encryptPassToCheck = sha256(saltedPass).toString(encBase64);

  if (hash === encryptPassToCheck) {
    return true;
  }

  return false;
};

module.exports = { encryptingFunction, decryptingFunction };
