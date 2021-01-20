const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

exports.read_dir_list = function(folder, option) {
  return new Promise((resolve, reject) => {
    fs.readdir(folder, (err, files) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(files);
    });
  });
};

/* to do async file exists use:

  try {
      await fs.promises.access(dconfigpath);

      console.log(dconfigpath + ' - present ');
  }
  catch (err) {
      console.log(dconfigpath + ' --- not present : ' + err);
  }

*/

exports.read_file = function(file, option) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, option, (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(stripBom(data));
    });
  });
};

exports.write_file = function(file, data, option) {
  return new Promise((resolve, reject) => {
    try {
      fs.writeFile(file, data, option, fileErr => {
        if (fileErr) {
          reject(fileErr);
          return;
        }

        resolve();
      });
    }
    catch (typeErr) {
      reject(typeErr);
    }
  });
};

exports.userPath = function() {
  return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
};

exports.getAlgorithm = function(keyHex) {
    return getAlgorithm(keyHex);
}

exports.encrypt = function(plainText, keyHex, ivHex) {
    return encrypt(plainText, keyHex, ivHex);
}

exports.decrypt = function(messageHex, keyHex, ivHex) {
    return decrypt(valueHex, keyHex, ivHex);
}

exports.encryptSetting = function(plainText, keyHex) {
    var ivHex = crypto.randomBytes(16).toString('hex');

    return ivHex + encrypt(plainText, keyHex, ivHex);
}

exports.decryptSetting = function(messageHex, keyHex) {
    var ivHex = messageHex.substr(0,32);
    var valueHex = messageHex.substr(32);

    return decrypt(valueHex, keyHex, ivHex);
}

exports.AESCryptoKeyFromParts = function(key1, key2) {
    var akey = AESCryptoKeyFromParts(key1, key2);

    if (! akey)
      return null;

    return akey.toString('hex');
}

exports.hmacSHA512CryptoKeyFromParts = function(key1, key2) {
    var akey = hmacSHA512CryptoKeyFromParts(key1, key2);

    if (! akey)
      return null;

    return akey.toString('hex');
}

const stripBom = function(content) {
  let result = '';

  if (Buffer.isBuffer(content)) {
    result = content.toString('utf8');
  }

  return result.replace(/^\uFEFF/, '');
}

function getAlgorithm(keyHex) {
    var key = Buffer.from(keyHex, 'hex');

    switch (key.length) {
        case 16:
            return 'aes-128-cbc';
        case 32:
            return 'aes-256-cbc';
    }

    throw new Error('Invalid key length: ' + key.length);
}

function encrypt(plainText, keyHex, ivHex) {
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');

    const cipher = crypto.createCipheriv(getAlgorithm(keyHex), key, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex')
    encrypted += cipher.final('hex');

    return encrypted;
};

function decrypt(messageHex, keyHex, ivHex) {
    const key = Buffer.from(keyHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');

    const decipher = crypto.createDecipheriv(getAlgorithm(keyHex), key, iv);
    let decrypted = decipher.update(messageHex, 'hex');
    decrypted += decipher.final();

    return decrypted;
}

function AESCryptoKeyFromParts(key1, key2) {
    var skey = cryptoKeyFromParts(key1, key2);

    if (! skey)
      return null;

    var akey = Buffer.alloc(32);
    skey.copy(akey, 0, 72, 72 + 32);

    return akey;
}

function hmacSHA512CryptoKeyFromParts(key1, key2) {
    return cryptoKeyFromParts(key1, key2);
}

function cryptoKeyFromParts(key1, key2) {
    if (! key1)
	    key1 = "48656c6c6f";
    else if (key1.length > 128)
	    key1 = key1.substr(key1.length - 128);

    var bkey1 = Buffer.from(key1, 'hex');

    if (! bkey1)
      return null;

    if (bkey1.length > 64) {
	    var b1 = Buffer.alloc(64);
	    bkey1.copy(b1, 0, bkey1.length - 64, bkey1.length - 64 + 64);
	    bkey1 = b1;
    }
    // TODO
    // else if (bkey1.length < 64) {
    //	byte[] b1 = new byte[64];
    //	ArrayUtil.blockCopy(bkey1, 0, b1, 64 - bkey1.length, bkey1.length);
    //	ArrayUtil.blockCopy(DEFAULT_SALT, 0, b1, 0, 64 - bkey1.length);
    //	bkey1 = b1;
    // }

    // key2

    if (! key2)
	    key2 = "576f726c64";
    else if (key2.length > 128)
	    key2 = key2.substr(key2.length - 128);

    var bkey2 = Buffer.from(key2, 'hex');

    if (! bkey2)
      return null;

    if (bkey2.length > 64) {
	    var b2 = Buffer.alloc(64);
	    bkey2.copy(b2, 0, bkey2.length - 64, bkey2.length - 64 + 64);
	    bkey2 = b2;
    }
    // TODO
    // else if (bkey2.length < 64) {
    //	byte[] b2 = new byte[64];
    //	ArrayUtil.blockCopy(bkey2, 0, b2, 64 - bkey2.length, bkey2.length);
    //	ArrayUtil.blockCopy(DEFAULT_SALT, 0, b2, 0, 64 - bkey2.length);
    //	bkey2 = b2;
    // }

    var skey = Buffer.alloc(128);

    bkey1.copy(skey, 64, 0, 64);

    bkey2.copy(skey, 0, 0, 64);

    return skey;
}
