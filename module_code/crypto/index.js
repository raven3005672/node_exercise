/*
 * @Author: yanglinylin.yang 
 * @Date: 2019-12-06 14:20:54 
 * @Last Modified by: yanglinylin.yang
 * @Last Modified time: 2019-12-09 20:00:54
 */

const crypto = require('crypto');
const secret = 'abcdefg';
const hash = crypto.createHmac('sha256', secret)
                    .update('I love cupcakes')
                    .digest('hex');
console.log(hash);
// 打印: c0fa1bc00531bd78ef38c628449c5102aeabd49b5dc3a2a516ea6ea959d6658e


// 使用Cipher对象作为流
const crypto = require('crypto');
const algorithm = 'aes-192-cbc';
const password = '用于生成密钥的密码';
// 密钥长度取决于算法
// 在此示例中，对于aes192，它是24个字节(192位)
// 改为使用异步的`crypto.script()`
const key = crypto.scriptSync(password, '盐值', 24);
// 使用crypto.randomBytes()生成随机的iv而不是此处显示的静态的iv
const iv = Buffer.alloc(16, 0);     // 初始化向量
const cipher = crypto.createCipheriv(algorithm, key, iv);
let encrypted = '';
cipher.on('readable', () => {
    let chunk;
    while (null !== (chunk = cipher.read())) {
        encrypted += chunk.toString('hex');
    }
});
cipher.on('end', () => {
    console.log(encrypted);
    // 打印: 9d47959b80d428936beef61216ef0b7653b5d23a670e082bd739f6cebcb6038f
});
cipher.write('要加密的数据');
cipher.end();

// 使用Cipher和管道流
const crypto = require('crypto');
const fs = require('fs');
const algorithm = 'aes-192-cbc';
const password = '用于生成密钥的密码';
// 改为使用异步的 `crypto.scrypt()`。
const key = crypto.scryptSync(password, '盐值', 24);
// 使用 `crypto.randomBytes()` 生成随机的 iv 而不是此处显示的静态的 iv。
const iv = Buffer.alloc(16, 0); // 初始化向量。
const cipher = crypto.createCipheriv(algorithm, key, iv);
const input = fs.createReadStream('要加密的数据.txt');
const output = fs.createWriteStream('加密后的数据.enc');
input.pipe(cipher).pipe(output);

// 使用cipher.update和cipher.final
const crypto = require('crypto');
const algorithm = 'aes-192-cbc';
const password = '用于生成密钥的密码';
// 改为使用异步的 `crypto.scrypt()`。
const key = crypto.scryptSync(password, '盐值', 24);
// 使用 `crypto.randomBytes()` 生成随机的 iv 而不是此处显示的静态的 iv。
const iv = Buffer.alloc(16, 0); // 初始化向量。
const cipher = crypto.createCipheriv(algorithm, key, iv);
let encrypted = cipher.update('要加密的数据', 'utf8', 'hex');
encrypted += cipher.final('hex');
console.log(encrypted);
// 打印: 9d47959b80d428936beef61216ef0b7653b5d23a670e082bd739f6cebcb6038f


// 使用Decipher对象作为流
const crypto = require('crypto');
const algorithm = 'aes-192-cbc';
const password = '用于生成密钥的密码';
// 密钥长度取决于算法。 
// 在此示例中，对于 aes192，它是 24 个字节（192 位）。
// 改为使用异步的 `crypto.scrypt()`。
const key = crypto.scryptSync(password, '盐值', 24);
// IV 通常与密文一起传递。
const iv = Buffer.alloc(16, 0); // 初始化向量。
const decipher = crypto.createDecipheriv(algorithm, key, iv);
let decrypted = '';
decipher.on('readable', () => {
    while (null !== (chunk = decipher.read())) {
        decrypted += chunk.toString('utf8');
    }
});
decipher.on('end', () => {
    console.log(decrypted);
    // 打印: 要加密的数据
});
// 使用相同的算法、密钥和 iv 进行加密。
const encrypted = '9d47959b80d428936beef61216ef0b7653b5d23a670e082bd739f6cebcb6038f';
decipher.write(encrypted, 'hex');
decipher.end();

// 使用Decipher和管道流
const crypto = require('crypto');
const fs = require('fs');
const algorithm = 'aes-192-cbc';
const password = '用于生成密钥的密码';
// 改为使用异步的 `crypto.scrypt()`。
const key = crypto.scryptSync(password, '盐值', 24);
// IV 通常与密文一起传递。
const iv = Buffer.alloc(16, 0); // 初始化向量。
const decipher = crypto.createDecipheriv(algorithm, key, iv);
const input = fs.createReadStream('要解密的数据.enc');
const output = fs.createWriteStream('解密后的数据.js');
input.pipe(decipher).pipe(output);

// 使用decipher.update和decipher.final方法
const crypto = require('crypto');
const algorithm = 'aes-192-cbc';
const password = '用于生成密钥的密码';
// 改为使用异步的 `crypto.scrypt()`。
const key = crypto.scryptSync(password, '盐值', 24);
// IV 通常与密文一起传递。
const iv = Buffer.alloc(16, 0); // 初始化向量。
const decipher = crypto.createDecipheriv(algorithm, key, iv);
// 使用相同的算法、密钥和 iv 进行加密。
const encrypted = '9d47959b80d428936beef61216ef0b7653b5d23a670e082bd739f6cebcb6038f';
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');
console.log(decrypted);
// 打印: 要加密的数据


// 使用Hash对象作为流
const crypto = require('crypto');
const hash = crypto.createHash('sha256');
hash.on('readable', () => {
    // 哈希流只会生成一个元素
    const data = hash.read();
    if (data) {
        console.log(data.toString('hex'));
        // 打印：
        // 164345eba9bccbafb94b27b8299d49cc2d80627fc9995b03230965e6d8bcbf56
    }
});
hash.write('要创建哈希摘要的数据');
hash.end();

// 使用Hash和管道流
const crypto = require('crypto');
const fs = require('fs');
const hash = crypto.createHash('sha256');
const input = fs.createReadStream('要创建哈希摘要的数据.txt');
input.pipe(hash).pipe(process.stdout);

// 使用hash.update和hash.digest方法
const crypto = require('crypto');
const hash = crypto.createHash('sha256');
hash.update('要创建哈希摘要的数据');
console.log(hash.digest('hex'));
// 打印:
// 164345eba9bccbafb94b27b8299d49cc2d80627fc9995b03230965e6d8bcbf56


// randomBytes生成加密强伪随机数据
// 异步的。
const crypto = require('crypto');
crypto.randomBytes(256, (err, buf) => {
    if (err) throw err;
    console.log(`${buf.length} 位的随机数据: ${buf.toString('hex')}`);
});
// 同步的。
const buf = crypto.randomBytes(256);
console.log(`${buf.length} 位的随机数据: ${buf.toString('hex')}`);




