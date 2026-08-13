const crypto = require('crypto');

const HASH_ALGORITHM = 'sha512';
const HASH_ITERATIONS = 120000;
const HASH_KEY_LENGTH = 64;

const hashPassword = (password) => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');

    crypto.pbkdf2(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_ALGORITHM, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(`${HASH_ITERATIONS}:${salt}:${derivedKey.toString('hex')}`);
    });
  });
};

const verifyPassword = (password, storedHash) => {
  return new Promise((resolve, reject) => {
    const [iterations, salt, hash] = storedHash.split(':');

    if (!iterations || !salt || !hash) {
      resolve(false);
      return;
    }

    crypto.pbkdf2(password, salt, Number(iterations), HASH_KEY_LENGTH, HASH_ALGORITHM, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      const storedBuffer = Buffer.from(hash, 'hex');
      const derivedBuffer = Buffer.from(derivedKey.toString('hex'), 'hex');

      if (storedBuffer.length !== derivedBuffer.length) {
        resolve(false);
        return;
      }

      resolve(crypto.timingSafeEqual(storedBuffer, derivedBuffer));
    });
  });
};

module.exports = {
  hashPassword,
  verifyPassword,
};
