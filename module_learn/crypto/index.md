# crypto（加密）

[本部分文档](http://nodejs.cn/api/crypto.html)

crypto 模块提供了加密功能，包括对 OpenSSL 的哈希、HMAC、加密、解密、签名、以及验证功能的一整套封装。

使用 require('crypto') 来访问该模块。

```js
const crypto = require('crypto');

const secret = 'abcdefg';
const hash = crypto.createHmac('sha256', secret)
                   .update('I love cupcakes')
                   .digest('hex');
console.log(hash);
// 打印:
//   c0fa1bc00531bd78ef38c628449c5102aeabd49b5dc3a2a516ea6ea959d6658e
```

## 检测是否支持 crypto

可以在不包括支持 crypto 模块的情况下构建 Node.js，这时调用 require('crypto') 将导致抛出异常。

```js
let crypto;
try {
  crypto = require('crypto');
} catch (err) {
  console.log('不支持 crypto');
}
```

## Certificate 类

SPKAC 最初是由 Netscape 实现的一种证书签名请求机制, 现在正式成为 HTML5 的 keygen 元素的一部分。

不推荐使用 <keygen>，因为 HTML 5.2 和新项目不再使用此元素。

crypto 模块提供 Certificate 类用于处理 SPKAC 数据。 最普遍的用法是处理 HTML5 keygen 元素产生的输出。 Node.js 内部使用 [OpenSSL 的 SPKAC 实现 处理。

### Certificate.exportChallenge(spkac)

* spkac <string> | <Buffer> | <TypedArray> | <DataView>

返回 <Buffer> 返回 spkac 数据结构的 challenge 部分， spkac 包含一个公钥和一个 challange。

```js
const { Certificate } = require('crypto');
const spkac = getSpkacSomehow();
const challenge = Certificate.exportChallenge(spkac);
console.log(challenge.toString('utf8'));
// 以 UTF 字符串的形式打印 challenge。
```

### Certificate.exportPublicKey(spkac[, encoding])

* spkac <string> | <Buffer> | <TypedArray> | <DataView>
* encoding <string> The encoding of the spkac string.
* Returns: <Buffer> The public key component of the spkac data structure, which includes a public key and a challenge.

```js
const { Certificate } = require('crypto');
const spkac = getSpkacSomehow();
const publicKey = Certificate.exportPublicKey(spkac);
console.log(publicKey);
// Prints: the public key as <Buffer ...>
```

### Certificate.verifySpkac(spkac)

* spkac <Buffer> | <TypedArray> | <DataView>
* 返回 <boolean> 如果 spkac 数据结构是有效的返回 true，否则返回 false。

```js
const { Certificate } = require('crypto');
const spkac = getSpkacSomehow();
console.log(Certificate.verifySpkac(Buffer.from(spkac)));
// 打印 true 或 false。
```

### 遗留的 API

As a still supported legacy interface, it is possible (but not recommended) to create new instances of the crypto.Certificate class as illustrated in the examples below.

#### new crypto.Certificate()

Instances of the Certificate class can be created using the new keyword or by calling crypto.Certificate() as a function:

```js
const crypto = require('crypto');

const cert1 = new crypto.Certificate();
const cert2 = crypto.Certificate();
```

#### certificate.exportChallenge(spkac)

* spkac <string> | <Buffer> | <TypedArray> | <DataView>
* Returns: <Buffer> The challenge component of the spkac data structure, which includes a public key and a challenge.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
const challenge = cert.exportChallenge(spkac);
console.log(challenge.toString('utf8'));
// Prints: the challenge as a UTF8 string
```

#### certificate.exportPublicKey(spkac)

* spkac <string> | <Buffer> | <TypedArray> | <DataView>
* Returns: <Buffer> The public key component of the spkac data structure, which includes a public key and a challenge.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
const publicKey = cert.exportPublicKey(spkac);
console.log(publicKey);
// Prints: the public key as <Buffer ...>
```

#### certificate.verifySpkac(spkac)

* spkac <Buffer> | <TypedArray> | <DataView>
* Returns: <boolean> true if the given spkac data structure is valid, false otherwise.

```js
const cert = require('crypto').Certificate();
const spkac = getSpkacSomehow();
console.log(cert.verifySpkac(Buffer.from(spkac)));
// Prints: true or false
```

## Cipher 类

* 继承自: <stream.Transform>

Cipher 类的实例用于加密数据。 该类可以通过以下两种方式之一使用：

* 作为可读写的流，其中写入未加密的数据以在可读侧生成加密的数据。
* 使用 cipher.update() 和 cipher.final() 方法生成加密的数据。

crypto.createCipher() 或 crypto.createCipheriv() 方法用于创建 Cipher 实例。 不能使用 new 关键字直接地创建 Cipher 对象。

示例，使用 Cipher 对象作为流：

```js
const crypto = require('crypto');

const algorithm = 'aes-192-cbc';
const password = '用于生成密钥的密码';
// 密钥长度取决于算法。 
// 在此示例中，对于 aes192，它是 24 个字节（192 位）。
// 改为使用异步的 `crypto.scrypt()`。
const key = crypto.scryptSync(password, '盐值', 24);
// 使用 `crypto.randomBytes()` 生成随机的 iv 而不是此处显示的静态的 iv。
const iv = Buffer.alloc(16, 0); // 初始化向量。

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
```

示例，使用 Cipher 和管道流：

```js
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
```

示例，使用 cipher.update() 和 cipher.final() 方法:

```js
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
```

### cipher.final([outputEncoding])

* outputEncoding <string> 返回值的字符编码。
* 返回: <Buffer> | <string> 任何剩余的加密内容。如果指定了 outputEncoding，则返回一个字符串。如果未提供 outputEncoding，则返回 Buffer。

一旦调用了 cipher.final() 方法，则 Cipher 对象就不能再用于加密数据。 如果试图多次调用 cipher.final()，则将会导致抛出错误。

### cipher.setAAD(buffer[, options])

* buffer <Buffer>
* options <Object> stream.transform options
    * plaintextLength <number>
* Returns: <Cipher> for method chaining.

When using an authenticated encryption mode (GCM, CCM and OCB are currently supported), the cipher.setAAD() method sets the value used for the additional authenticated data (AAD) input parameter.

The options argument is optional for GCM and OCB. When using CCM, the plaintextLength option must be specified and its value must match the length of the plaintext in bytes. See CCM mode.

The cipher.setAAD() method must be called before cipher.update().

### cipher.getAuthTag()

* 返回: <Buffer> 当使用经验证的加密模式时（目前只支持 GCM、 CCM 和 CCM）， cipher.getAuthTag() 方法返回一个 Buffer，它包含已从给定数据计算后的认证标签。

cipher.getAuthTag() 方法只能在使用 cipher.final() 方法完全加密后调用。

### cipher.setAutoPadding([autoPadding])

* autoPadding <boolean> 默认值: true。
* 返回: <Cipher> 方法链。

当使用块加密算法时， Cipher 类会自动添加填充到输入数据中，来适配相应块大小。 可调用 cipher.setAutoPadding(false) 禁用默认填充。

当 autoPadding 是 false 时，整个输入数据的长度必须是 cipher 块大小的倍数，否则 cipher.final() 将抛出一个错误。 禁用自动填充对于非标准填充是有用的，例如使用 0x0 代替 PKCS 填充。

cipher.setAutoPadding() 必须在 cipher.final() 之前被调用。

### cipher.update(data[, inputEncoding][, outputEncoding])

* data <string> | <Buffer> | <TypedArray> | <DataView>
* inputEncoding <string> 数据的字符编码。
* outputEncoding <string> 返回值的字符编码。
* 返回: <Buffer> | <string>

使用 data 更新加密。 如果指定了 inputEncoding 参数，则 data 参数是使用了指定的字符编码的字符串。 如果未指定 inputEncoding 参数，则 data 必须是一个 Buffer、 TypedArray 或 DataView。 如果 data 是一个 Buffer、 TypedArray 或 DataView，则 inputEncoding 会被忽略。

outputEncoding 指定了加密的数据的输出格式。 如果指定了 outputEncoding，则返回使用了指定的字符编码的字符串。 如果未提供 outputEncoding，则返回 Buffer。

可以使用新数据多次调用 cipher.update() 方法，直到 cipher.final() 被调用。 在 cipher.final() 之后调用 cipher.update() 将会导致抛出错误。

## Decipher 类

* 继承自: <stream.Transform>

Decipher 类的实例用于解密数据。 该类可以通过以下两种方式之一使用：

* 作为可读写的流，其中写入加密的数据以在可读侧生成未加密的数据。
* 使用 decipher.update() 和 decipher.final() 方法生成未加密的数据。

crypto.createDecipher() 或 crypto.createDecipheriv() 方法用于创建 Decipher 实例。 不能使用 new 关键字直接地创建 Decipher 对象。

示例，使用 Decipher 对象作为流：

```js
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
const encrypted =
  '9d47959b80d428936beef61216ef0b7653b5d23a670e082bd739f6cebcb6038f';
decipher.write(encrypted, 'hex');
decipher.end();
```

示例，使用 Decipher 和管道流：

```js
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
```

示例，使用 decipher.update() 和 decipher.final() 方法：

```js
const crypto = require('crypto');

const algorithm = 'aes-192-cbc';
const password = '用于生成密钥的密码';
// 改为使用异步的 `crypto.scrypt()`。
const key = crypto.scryptSync(password, '盐值', 24);
// IV 通常与密文一起传递。
const iv = Buffer.alloc(16, 0); // 初始化向量。

const decipher = crypto.createDecipheriv(algorithm, key, iv);

// 使用相同的算法、密钥和 iv 进行加密。
const encrypted =
  '9d47959b80d428936beef61216ef0b7653b5d23a670e082bd739f6cebcb6038f';
let decrypted = decipher.update(encrypted, 'hex', 'utf8');
decrypted += decipher.final('utf8');
console.log(decrypted);
// 打印: 要加密的数据
```

### decipher.final([outputEncoding])

* outputEncoding <string> 返回值的字符编码。
* 返回: <Buffer> | <string> 任何剩余的解密内容。如果指定了 outputEncoding，则返回一个字符串。如果未提供 outputEncoding，则返回 Buffer。

一旦调用了 decipher.final() 方法，则 Decipher 对象就不能再用于解密数据。 如果试图多次调用 decipher.final()，则将会导致抛出错误。

### decipher.setAAD(buffer[, options])

* buffer <Buffer> | <TypedArray> | <DataView>
* options <Object> stream.transform options
    * plaintextLength <number>
* Returns: <Decipher> for method chaining.

When using an authenticated encryption mode (GCM, CCM and OCB are currently supported), the decipher.setAAD() method sets the value used for the additional authenticated data (AAD) input parameter.

The options argument is optional for GCM. When using CCM, the plaintextLength option must be specified and its value must match the length of the plaintext in bytes. See CCM mode.

The decipher.setAAD() method must be called before decipher.update().

### decipher.setAuthTag(buffer)

* buffer <Buffer> | <TypedArray> | <DataView>
* Returns: <Decipher> for method chaining.

When using an authenticated encryption mode (GCM, CCM and OCB are currently supported), the decipher.setAuthTag() method is used to pass in the received authentication tag. If no tag is provided, or if the cipher text has been tampered with, decipher.final() will throw, indicating that the cipher text should be discarded due to failed authentication. If the tag length is invalid according to NIST SP 800-38D or does not match the value of the authTagLength option, decipher.setAuthTag() will throw an error.

The decipher.setAuthTag() method must be called before decipher.final() and can only be called once.

### decipher.setAutoPadding([autoPadding])

* autoPadding <boolean> Default: true
* Returns: <Decipher> for method chaining.

When data has been encrypted without standard block padding, calling decipher.setAutoPadding(false) will disable automatic padding to prevent decipher.final() from checking for and removing padding.

Turning auto padding off will only work if the input data's length is a multiple of the ciphers block size.

The decipher.setAutoPadding() method must be called before decipher.final().

### decipher.update(data[, inputEncoding][, outputEncoding])

* data <string> | <Buffer> | <TypedArray> | <DataView>
* inputEncoding <string> 数据的字符编码。
* outputEncoding <string> 返回值的字符编码。
* 返回: <Buffer> | <string>

使用 data 更新解密。 如果指定了 inputEncoding 参数，则 data 参数是使用了指定的字符编码的字符串。 如果未指定 inputEncoding 参数，则 data 必须是一个 Buffer、 TypedArray 或 DataView。 如果 data 是一个 Buffer、 TypedArray 或 DataView，则 inputEncoding 会被忽略。

outputEncoding 指定了解密的数据的输出格式。 如果指定了 outputEncoding，则返回使用了指定的字符编码的字符串。 如果未提供 outputEncoding，则返回 Buffer。

可以使用新数据多次调用 decipher.update() 方法，直到 decipher.final() 被调用。 在 decipher.final() 之后调用 decipher.update() 将会导致抛出错误。

## DiffieHellman 类

DiffieHellman 类是一个用来创建 Diffie-Hellman 键交换的工具。

DiffieHellman 类的实例可以使用 crypto.createDiffieHellman() 方法。

```js
const crypto = require('crypto');
const assert = require('assert');

// 生成 Alice 的密钥。
const alice = crypto.createDiffieHellman(2048);
const aliceKey = alice.generateKeys();

// 生成 Bob 的密钥。
const bob = crypto.createDiffieHellman(alice.getPrime(), alice.getGenerator());
const bobKey = bob.generateKeys();

// 交换并生成密钥。
const aliceSecret = alice.computeSecret(bobKey);
const bobSecret = bob.computeSecret(aliceKey);

// 完成。
assert.strictEqual(aliceSecret.toString('hex'), bobSecret.toString('hex'));
```

### diffieHellman.computeSecret(otherPublicKey[, inputEncoding][, outputEncoding])

* otherPublicKey <string> | <Buffer> | <TypedArray> | <DataView>
* inputEncoding <string> The encoding of an otherPublicKey string.
* outputEncoding <string> The encoding of the return value.
* Returns: <Buffer> | <string>

Computes the shared secret using otherPublicKey as the other party's public key and returns the computed shared secret. The supplied key is interpreted using the specified inputEncoding, and secret is encoded using specified outputEncoding. If the inputEncoding is not provided, otherPublicKey is expected to be a Buffer, TypedArray, or DataView.

If outputEncoding is given a string is returned; otherwise, a Buffer is returned.

### diffieHellman.generateKeys([encoding])

* encoding <string> The encoding of the return value.
* Returns: <Buffer> | <string>

Generates private and public Diffie-Hellman key values, and returns the public key in the specified encoding. This key should be transferred to the other party. If encoding is provided a string is returned; otherwise a Buffer is returned.

### diffieHellman.getGenerator([encoding])

* encoding <string> The encoding of the return value.
* Returns: <Buffer> | <string>

Returns the Diffie-Hellman generator in the specified encoding. If encoding is provided a string is returned; otherwise a Buffer is returned.

### diffieHellman.getPrime([encoding])

* encoding <string> The encoding of the return value.
* Returns: <Buffer> | <string>

Returns the Diffie-Hellman prime in the specified encoding. If encoding is provided a string is returned; otherwise a Buffer is returned.

### diffieHellman.getPrivateKey([encoding])

* encoding <string> The encoding of the return value.
* Returns: <Buffer> | <string>

Returns the Diffie-Hellman private key in the specified encoding. If encoding is provided a string is returned; otherwise a Buffer is returned.

### diffieHellman.getPublicKey([encoding])

* encoding <string> The encoding of the return value.
* Returns: <Buffer> | <string>

Returns the Diffie-Hellman public key in the specified encoding. If encoding is provided a string is returned; otherwise a Buffer is returned.

### diffieHellman.setPrivateKey(privateKey[, encoding])

* privateKey <string> | <Buffer> | <TypedArray> | <DataView>
* encoding <string> The encoding of the privateKey string.

Sets the Diffie-Hellman private key. If the encoding argument is provided, privateKey is expected to be a string. If no encoding is provided, privateKey is expected to be a Buffer, TypedArray, or DataView.

### diffieHellman.setPublicKey(publicKey[, encoding])

* publicKey <string> | <Buffer> | <TypedArray> | <DataView>
* encoding <string> The encoding of the publicKey string.

Sets the Diffie-Hellman public key. If the encoding argument is provided, publicKey is expected to be a string. If no encoding is provided, publicKey is expected to be a Buffer, TypedArray, or DataView.

### diffieHellman.verifyError

A bit field containing any warnings and/or errors resulting from a check performed during initialization of the DiffieHellman object.

The following values are valid for this property (as defined in constants module):

* DH_CHECK_P_NOT_SAFE_PRIME
* DH_CHECK_P_NOT_PRIME
* DH_UNABLE_TO_CHECK_GENERATOR
* DH_NOT_SUITABLE_GENERATOR

## DiffieHellmanGroup 类

The DiffieHellmanGroup class takes a well-known modp group as its argument but otherwise works the same as DiffieHellman.

```js
const name = 'modp1';
const dh = crypto.createDiffieHellmanGroup(name);
```

name is taken from RFC 2412 (modp1 and 2) and RFC 3526:

```shell
$ perl -ne 'print "$1\n" if /"(modp\d+)"/' src/node_crypto_groups.h
modp1  #  768 bits
modp2  # 1024 bits
modp5  # 1536 bits
modp14 # 2048 bits
modp15 # etc.
modp16
modp17
modp18
```

## ECDH 类

ECDH 类是创建椭圆曲线 Elliptic Curve Diffie-Hellman（ECDH）键交换的实用工具。

ECDH 类的实例可以使用 crypto.createECDH() 方法。

```js
const crypto = require('crypto');
const assert = require('assert');

// 生成 Alice 的密钥。
const alice = crypto.createECDH('secp521r1');
const aliceKey = alice.generateKeys();

// 生成 Bob 的密钥。
const bob = crypto.createECDH('secp521r1');
const bobKey = bob.generateKeys();

// 交换并生成密钥。
const aliceSecret = alice.computeSecret(bobKey);
const bobSecret = bob.computeSecret(aliceKey);

assert.strictEqual(aliceSecret.toString('hex'), bobSecret.toString('hex'));
// 完成
```

### ECDH.convertKey(key, curve[, inputEncoding[, outputEncoding[, format]]])

* key <string> | <Buffer> | <TypedArray> | <DataView>
* curve <string>
* inputEncoding <string> The encoding of the key string.
* outputEncoding <string> The encoding of the return value.
* format <string> Default: 'uncompressed'
* Returns: <Buffer> | <string>

Converts the EC Diffie-Hellman public key specified by key and curve to the format specified by format. The format argument specifies point encoding and can be 'compressed', 'uncompressed' or 'hybrid'. The supplied key is interpreted using the specified inputEncoding, and the returned key is encoded using the specified outputEncoding.

Use crypto.getCurves() to obtain a list of available curve names. On recent OpenSSL releases, openssl ecparam -list_curves will also display the name and description of each available elliptic curve.

If format is not specified the point will be returned in 'uncompressed' format.

If the inputEncoding is not provided, key is expected to be a Buffer, TypedArray, or DataView.

Example (uncompressing a key):

```js
const { createECDH, ECDH } = require('crypto');

const ecdh = createECDH('secp256k1');
ecdh.generateKeys();

const compressedKey = ecdh.getPublicKey('hex', 'compressed');

const uncompressedKey = ECDH.convertKey(compressedKey,
                                        'secp256k1',
                                        'hex',
                                        'hex',
                                        'uncompressed');

// The converted key and the uncompressed public key should be the same
console.log(uncompressedKey === ecdh.getPublicKey('hex'));
```

### ecdh.computeSecret(otherPublicKey[, inputEncoding][, outputEncoding])

* otherPublicKey <string> | <Buffer> | <TypedArray> | <DataView>
* inputEncoding <string> The encoding of the otherPublicKey string.
* outputEncoding <string> The encoding of the return value.
* Returns: <Buffer> | <string>

Computes the shared secret using otherPublicKey as the other party's public key and returns the computed shared secret. The supplied key is interpreted using specified inputEncoding, and the returned secret is encoded using the specified outputEncoding. If the inputEncoding is not provided, otherPublicKey is expected to be a Buffer, TypedArray, or DataView.

If outputEncoding is given a string will be returned; otherwise a Buffer is returned.

ecdh.computeSecret will throw an ERR_CRYPTO_ECDH_INVALID_PUBLIC_KEY error when otherPublicKey lies outside of the elliptic curve. Since otherPublicKey is usually supplied from a remote user over an insecure network, its recommended for developers to handle this exception accordingly.

### ecdh.generateKeys([encoding[, format]])

* encoding <string> The encoding of the return value.
* format <string> Default: 'uncompressed'
* Returns: <Buffer> | <string>

Generates private and public EC Diffie-Hellman key values, and returns the public key in the specified format and encoding. This key should be transferred to the other party.

The format argument specifies point encoding and can be 'compressed' or 'uncompressed'. If format is not specified, the point will be returned in 'uncompressed' format.

If encoding is provided a string is returned; otherwise a Buffer is returned.

### ecdh.getPrivateKey([encoding])

* encoding <string> The encoding of the return value.
* Returns: <Buffer> | <string> The EC Diffie-Hellman in the specified encoding.

If encoding is specified, a string is returned; otherwise a Buffer is returned.

### ecdh.getPublicKey([encoding][, format])

* encoding <string> The encoding of the return value.
* format <string> Default: 'uncompressed'
* Returns: <Buffer> | <string> The EC Diffie-Hellman public key in the specified encoding and format.

The format argument specifies point encoding and can be 'compressed' or 'uncompressed'. If format is not specified the point will be returned in 'uncompressed' format.

If encoding is specified, a string is returned; otherwise a Buffer is returned.

### ecdh.setPrivateKey(privateKey[, encoding])

* privateKey <string> | <Buffer> | <TypedArray> | <DataView>
* encoding <string> The encoding of the privateKey string.

Sets the EC Diffie-Hellman private key. If encoding is provided, privateKey is expected to be a string; otherwise privateKey is expected to be a Buffer, TypedArray, or DataView.

If privateKey is not valid for the curve specified when the ECDH object was created, an error is thrown. Upon setting the private key, the associated public point (key) is also generated and set in the ECDH object.

### ecdh.setPublicKey(publicKey[, encoding])

稳定性: 0 - 废弃

* publicKey <string> | <Buffer> | <TypedArray> | <DataView>
* encoding <string> The encoding of the publicKey string.

Sets the EC Diffie-Hellman public key. If encoding is provided publicKey is expected to be a string; otherwise a Buffer, TypedArray, or DataView is expected.

There is not normally a reason to call this method because ECDH only requires a private key and the other party's public key to compute the shared secret. Typically either ecdh.generateKeys() or ecdh.setPrivateKey() will be called. The ecdh.setPrivateKey() method attempts to generate the public point/key associated with the private key being set.

Example (obtaining a shared secret):

```js
const crypto = require('crypto');
const alice = crypto.createECDH('secp256k1');
const bob = crypto.createECDH('secp256k1');

// This is a shortcut way of specifying one of Alice's previous private
// keys. It would be unwise to use such a predictable private key in a real
// application.
alice.setPrivateKey(
  crypto.createHash('sha256').update('alice', 'utf8').digest()
);

// Bob uses a newly generated cryptographically strong
// pseudorandom key pair
bob.generateKeys();

const aliceSecret = alice.computeSecret(bob.getPublicKey(), null, 'hex');
const bobSecret = bob.computeSecret(alice.getPublicKey(), null, 'hex');

// aliceSecret and bobSecret should be the same shared secret value
console.log(aliceSecret === bobSecret);
```

## Hash 类

* 继承自: <stream.Transform>

Hash 类是一个实用工具，用于创建数据的哈希摘要。 它可以通过以下两种方式之一使用：

* 作为可读写的流，其中写入数据以在可读侧生成计算后的哈希摘要。
* 使用 hash.update() 和 hash.digest() 方法生成计算后的哈希。

crypto.createHash() 方法用于创建 Hash 实例。 不能使用 new 关键字直接地创建 Hash 对象。

示例，使用 Hash 对象作为流：

```js
const crypto = require('crypto');
const hash = crypto.createHash('sha256');

hash.on('readable', () => {
  // 哈希流只会生成一个元素。
  const data = hash.read();
  if (data) {
    console.log(data.toString('hex'));
    // 打印:
    //   164345eba9bccbafb94b27b8299d49cc2d80627fc9995b03230965e6d8bcbf56
  }
});

hash.write('要创建哈希摘要的数据');
hash.end();
```

示例，使用 Hash 和管道流：

```js
const crypto = require('crypto');
const fs = require('fs');
const hash = crypto.createHash('sha256');

const input = fs.createReadStream('要创建哈希摘要的数据.txt');
input.pipe(hash).pipe(process.stdout);
```

示例，使用 hash.update() 和 hash.digest() 方法：

```js
const crypto = require('crypto');
const hash = crypto.createHash('sha256');

hash.update('要创建哈希摘要的数据');
console.log(hash.digest('hex'));
// 打印:
//   164345eba9bccbafb94b27b8299d49cc2d80627fc9995b03230965e6d8bcbf56
```

### hash.digest([encoding])

* encoding <string> 返回值的字符编码。
* 返回: <Buffer> | <string>

计算传入要被哈希（使用 hash.update() 方法）的所有数据的摘要。 如果提供了 encoding，则返回字符串，否则返回 Buffer。

调用 hash.digest() 方法之后， Hash 对象不能被再次使用。 多次调用将会导致抛出错误。

### hash.update(data[, inputEncoding])

* data <string> | <Buffer> | <TypedArray> | <DataView>
* inputEncoding <string> data 字符串的字符编码。

使用给定的 data 更新哈希的内容，该数据的字符编码在 inputEncoding 中给出。 如果未提供 encoding，并且 data 是字符串，则强制执行 'utf8' 的编码。 如果 data 是一个 Buffer、 TypedArray 或 DataView，则 inputEncoding 会被忽略。

在流式传输时，可以使用新数据多次调用此方法。

## Hmac 类

* 继承自: <stream.Transform>

Hmac 类是一个实用工具，用于创建加密的 HMAC 摘要。 它可以通过以下两种方式之一使用：

* 作为可读写的流，其中写入数据以在可读侧生成计算后的 HMAC 摘要。
* 使用 hmac.update() 和 hmac.digest() 方法生成计算后的 HMAC 摘要。

crypto.createHmac() 方法用于创建 Hmac 实例。 不能使用 new 关键字直接地创建 Hmac 对象。

示例，使用 Hmac 对象作为流：

```js
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', '密钥');

hmac.on('readable', () => {
  // 哈希流只会生成一个元素。
  const data = hmac.read();
  if (data) {
    console.log(data.toString('hex'));
    // 打印:
    //   d0b5490ab4beb8e6545fe284f484d0d595e46086cb8e6ef2291af12ac684102f
  }
});

hmac.write('要创建哈希的数据');
hmac.end();
```

示例，使用 Hmac 和管道流：

```js
const crypto = require('crypto');
const fs = require('fs');
const hmac = crypto.createHmac('sha256', '密钥');

const input = fs.createReadStream('要创建哈希的数据.txt');
input.pipe(hmac).pipe(process.stdout);
```

示例，使用 hmac.update() 和 hmac.digest() 方法：

```js
const crypto = require('crypto');
const hmac = crypto.createHmac('sha256', '密钥');

hmac.update('要创建哈希的数据');
console.log(hmac.digest('hex'));
// 打印:
//   d0b5490ab4beb8e6545fe284f484d0d595e46086cb8e6ef2291af12ac684102f
```

### hmac.digest([encoding])

* encoding <string> 返回值的字符编码。
* 返回: <Buffer> | <string>

计算使用 hmac.update() 传入的所有数据的 HMAC 摘要。 如果提供了 encoding，则返回字符串，否则返回 Buffer。

调用 hmac.digest() 方法之后， Hmac 对象不能被再次使用。 多次调用 hmac.digest() 将会导致抛出错误。

### hmac.update(data[, inputEncoding])

* data <string> | <Buffer> | <TypedArray> | <DataView>
* inputEncoding <string> data 字符串的字符编码。

使用给定的 data 更新 Hmac 的内容，该数据的字符编码在 inputEncoding 中给出。 如果未提供 encoding，并且 data 是字符串，则强制执行 'utf8' 的编码。 如果 data 是一个 Buffer、 TypedArray 或 DataView，则 inputEncoding 会被忽略。

在流式传输时，可以使用新数据多次调用此方法。

## KeyObject 类

Node.js uses a KeyObject class to represent a symmetric or asymmetric key, and each kind of key exposes different functions. The crypto.createSecretKey(), crypto.createPublicKey() and crypto.createPrivateKey() methods are used to create KeyObject instances. KeyObject objects are not to be created directly using the new keyword.

Most applications should consider using the new KeyObject API instead of passing keys as strings or Buffers due to improved security features.

### keyObject.asymmetricKeyType

* <string>

For asymmetric keys, this property represents the type of the key. Supported key types are:

* 'rsa' (OID 1.2.840.113549.1.1.1)
* 'rsa-pss' (OID 1.2.840.113549.1.1.10)
* 'dsa' (OID 1.2.840.10040.4.1)
* 'ec' (OID 1.2.840.10045.2.1)
* 'x25519' (OID 1.3.101.110)
* 'x448' (OID 1.3.101.111)
* 'ed25519' (OID 1.3.101.112)
* 'ed448' (OID 1.3.101.113)

This property is undefined for unrecognized KeyObject types and symmetric keys.

### keyObject.export([options])

* options: <Object>
* Returns: <string> | <Buffer>

For symmetric keys, this function allocates a Buffer containing the key material and ignores any options.

For asymmetric keys, the options parameter is used to determine the export format.

For public keys, the following encoding options can be used:

* type: <string> Must be one of 'pkcs1' (RSA only) or 'spki'.
* format: <string> Must be 'pem' or 'der'.

For private keys, the following encoding options can be used:

* type: <string> Must be one of 'pkcs1' (RSA only), 'pkcs8' or 'sec1' (EC only).
* format: <string> Must be 'pem' or 'der'.
* cipher: <string> If specified, the private key will be encrypted with the given cipher and passphrase using PKCS#5 v2.0 password based encryption.
* passphrase: <string> | <Buffer> The passphrase to use for encryption, see cipher.

When PEM encoding was selected, the result will be a string, otherwise it will be a buffer containing the data encoded as DER.

PKCS#1, SEC1, and PKCS#8 type keys can be encrypted by using a combination of the cipher and format options. The PKCS#8 type can be used with any format to encrypt any key algorithm (RSA, EC, or DH) by specifying a cipher. PKCS#1 and SEC1 can only be encrypted by specifying a cipher when the PEM format is used. For maximum compatibility, use PKCS#8 for encrypted private keys. Since PKCS#8 defines its own encryption mechanism, PEM-level encryption is not supported when encrypting a PKCS#8 key. See RFC 5208 for PKCS#8 encryption and RFC 1421 for PKCS#1 and SEC1 encryption.

### keyObject.symmetricKeySize

* <number>

For secret keys, this property represents the size of the key in bytes. This property is undefined for asymmetric keys.

### keyObject.type

* <string>

Depending on the type of this KeyObject, this property is either 'secret' for secret (symmetric) keys, 'public' for public (asymmetric) keys or 'private' for private (asymmetric) keys.

## Sign 类

* 继承自: <stream.Writable>

Sign 类是一个实用工具，用于生成签名。 它可以通过以下两种方式之一使用：

作为可写的流，其中写入要签名的数据，并使用 sign.sign() 方法生成和返回签名。
使用 sign.update() 和 sign.sign() 方法生成签名。
crypto.createSign() 方法用于创建 Sign 实例。 参数是要使用的哈希函数的字符串名称。 不能使用 new 关键字直接地创建 Sign 对象。

示例，使用 Sign 和 Verify 对象作为流：

```js
const crypto = require('crypto');

const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'sect239k1'
});

const sign = crypto.createSign('SHA256');
sign.write('要生成签名的数据');
sign.end();
const signature = sign.sign(privateKey, 'hex');

const verify = crypto.createVerify('SHA256');
verify.write('要生成签名的数据');
verify.end();
console.log(verify.verify(publicKey, signature));
// 打印 true 或 false。
```

示例，使用 sign.update() 和 verify.update() 方法：

```js
const crypto = require('crypto');

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

const sign = crypto.createSign('SHA256');
sign.update('要生成签名的数据');
sign.end();
const signature = sign.sign(privateKey);

const verify = crypto.createVerify('SHA256');
verify.update('要生成签名的数据');
verify.end();
console.log(verify.verify(publicKey, signature));
// 打印: true
```

### sign.sign(privateKey[, outputEncoding])

* privateKey <Object> | <string> | <Buffer> | <KeyObject>
    * padding <integer>
    * saltLength <integer>
* outputEncoding <string> The encoding of the return value.
* Returns: <Buffer> | <string>

Calculates the signature on all the data passed through using either sign.update() or sign.write().

If privateKey is not a KeyObject, this function behaves as if privateKey had been passed to crypto.createPrivateKey(). If it is an object, the following additional properties can be passed:

* padding <integer> Optional padding value for RSA, one of the following:
    * crypto.constants.RSA_PKCS1_PADDING (default)
    * crypto.constants.RSA_PKCS1_PSS_PADDING

RSA_PKCS1_PSS_PADDING will use MGF1 with the same hash function used to sign the message as specified in section 3.1 of RFC 4055, unless an MGF1 hash function has been specified as part of the key in compliance with section 3.3 of RFC 4055.

* saltLength <integer> Salt length for when padding is RSA_PKCS1_PSS_PADDING. The special value crypto.constants.RSA_PSS_SALTLEN_DIGEST sets the salt length to the digest size, crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN (default) sets it to the maximum permissible value.

If outputEncoding is provided a string is returned; otherwise a Buffer is returned.

The Sign object can not be again used after sign.sign() method has been called. Multiple calls to sign.sign() will result in an error being thrown.

### sign.update(data[, inputEncoding])

* data <string> | <Buffer> | <TypedArray> | <DataView>
* inputEncoding <string> data 字符串的字符编码。

使用给定的 data 更新 Sign 的内容，该数据的字符编码在 inputEncoding 中给出。 如果未提供 encoding，并且 data 是字符串，则强制执行 'utf8' 的编码。 如果 data 是一个 Buffer、 TypedArray 或 DataView，则 inputEncoding 会被忽略。

在流式传输时，可以使用新数据多次调用此方法。

## Verify 类

* 继承自: <stream.Writable>

Verify 类是一个实用工具，用于验证签名。 它可以通过以下两种方式之一使用：

作为可写的流，其中使用写入的数据来验证提供的签名。
使用 verify.update() 和 verify.verify() 方法来验证签名。
crypto.createVerify() 方法用于创建 Verify 实例。 不能使用 new 关键字直接地创建 Verify 对象。

有关示例，请参阅 Sign。

### verify.update(data[, inputEncoding])

* data <string> | <Buffer> | <TypedArray> | <DataView>
* inputEncoding <string> data 字符串的字符编码。

使用给定的 data 更新 Verify 的内容，该数据的字符编码在 inputEncoding 中给出。 如果未提供 encoding，并且 data 是字符串，则强制执行 'utf8' 的编码。 如果 data 是一个 Buffer、 TypedArray 或 DataView，则 inputEncoding 会被忽略。

在流式传输时，可以使用新数据多次调用此方法。

### verify.verify(object, signature[, signatureEncoding])

* object <Object> | <string> | <Buffer> | <KeyObject>
    * padding <integer>
    * saltLength <integer>
* signature <string> | <Buffer> | <TypedArray> | <DataView>
* signatureEncoding <string> The encoding of the signature string.
* Returns: <boolean> true or false depending on the validity of the signature for the data and public key.

Verifies the provided data using the given object and signature.

If object is not a KeyObject, this function behaves as if object had been passed to crypto.createPublicKey(). If it is an object, the following additional properties can be passed:

* padding <integer> Optional padding value for RSA, one of the following:
    * crypto.constants.RSA_PKCS1_PADDING (default)
    * crypto.constants.RSA_PKCS1_PSS_PADDING
RSA_PKCS1_PSS_PADDING will use MGF1 with the same hash function used to verify the message as specified in section 3.1 of RFC 4055, unless an MGF1 hash function has been specified as part of the key in compliance with section 3.3 of RFC 4055.

* saltLength <integer> Salt length for when padding is RSA_PKCS1_PSS_PADDING. The special value crypto.constants.RSA_PSS_SALTLEN_DIGEST sets the salt length to the digest size, crypto.constants.RSA_PSS_SALTLEN_AUTO (default) causes it to be determined automatically.

The signature argument is the previously calculated signature for the data, in the signatureEncoding. If a signatureEncoding is specified, the signature is expected to be a string; otherwise signature is expected to be a Buffer, TypedArray, or DataView.

The verify object can not be used again after verify.verify() has been called. Multiple calls to verify.verify() will result in an error being thrown.

Because public keys can be derived from private keys, a private key may be passed instead of a public key.

## crypto 模块的方法和属性

### crypto.constants

* Returns: <Object> An object containing commonly used constants for crypto and security related operations. The specific constants currently defined are described in Crypto Constants.

### crypto.DEFAULT_ENCODING

稳定性: 0 - 废弃

The default encoding to use for functions that can take either strings or buffers. The default value is 'buffer', which makes methods default to Buffer objects.

The crypto.DEFAULT_ENCODING mechanism is provided for backwards compatibility with legacy programs that expect 'latin1' to be the default encoding.

New applications should expect the default to be 'buffer'.

This property is deprecated.

### crypto.fips

稳定性: 0 - 废弃

Property for checking and controlling whether a FIPS compliant crypto provider is currently in use. Setting to true requires a FIPS build of Node.js.

This property is deprecated. Please use crypto.setFips() and crypto.getFips() instead.

### crypto.createCipher(algorithm, password[, options])

稳定性: 0 - 废弃: 改为使用 crypto.createCipheriv() 。

* algorithm <string>
* password <string> | <Buffer> | <TypedArray> | <DataView>
* options <Object> stream.transform options
* Returns: <Cipher>

Creates and returns a Cipher object that uses the given algorithm and password.

The options argument controls stream behavior and is optional except when a cipher in CCM or OCB mode is used (e.g. 'aes-128-ccm'). In that case, the authTagLength option is required and specifies the length of the authentication tag in bytes, see CCM mode. In GCM mode, the authTagLength option is not required but can be used to set the length of the authentication tag that will be returned by getAuthTag() and defaults to 16 bytes.

The algorithm is dependent on OpenSSL, examples are 'aes192', etc. On recent OpenSSL releases, openssl list -cipher-algorithms (openssl list-cipher-algorithms for older versions of OpenSSL) will display the available cipher algorithms.

The password is used to derive the cipher key and initialization vector (IV). The value must be either a 'latin1' encoded string, a Buffer, a TypedArray, or a DataView.

The implementation of crypto.createCipher() derives keys using the OpenSSL function EVP_BytesToKey with the digest algorithm set to MD5, one iteration, and no salt. The lack of salt allows dictionary attacks as the same password always creates the same key. The low iteration count and non-cryptographically secure hash algorithm allow passwords to be tested very rapidly.

In line with OpenSSL's recommendation to use a more modern algorithm instead of EVP_BytesToKey it is recommended that developers derive a key and IV on their own using crypto.scrypt() and to use crypto.createCipheriv() to create the Cipher object. Users should not use ciphers with counter mode (e.g. CTR, GCM, or CCM) in crypto.createCipher(). A warning is emitted when they are used in order to avoid the risk of IV reuse that causes vulnerabilities. For the case when IV is reused in GCM, see Nonce-Disrespecting Adversaries for details.

### crypto.createCipheriv(algorithm, key, iv[, options])

* algorithm <string>
* key <string> | <Buffer> | <TypedArray> | <DataView> | <KeyObject>
* iv <string> | <Buffer> | <TypedArray> | <DataView> | <null>
* options <Object> stream.transform 的选项。
* 返回: <Cipher>

使用给定的 algorithm、 key 和初始化向量（iv）创建并返回一个 Cipher 对象。

options 参数控制流的行为，它是可选的，除非使用 CCM 或 OCB 模式的密码（例如 'aes-128-ccm'）。 在这种情况下，必须使用 authTagLength 选项，并以字节为单位指定身份验证标签的长度，参阅 CCM 模式。 在 GCM 模式中，不需要 authTagLength 选项，但可以使用它来设置将会由 getAuthTag() 返回的身份验证标签的长度，默认为 16 个字节。

algorithm 取决于 OpenSSL，例如 'aes192' 等。 在 OpenSSL 的最新版本中， openssl list -cipher-algorithms（在较旧版本的 OpenSSL 中是 openssl list-cipher-algorithms）将会显示可用的密码算法。

key 是 algorithm 使用的原始密钥， iv 是初始化向量。 两个参数都必须是 'utf8' 编码的字符串、Buffer、 TypedArray 或 DataView。 key 可以是 secret 类型的 KeyObject。 如果密码不需要初始化向量，则 iv 可以为 null。

初始化向量应该是不可预测的且唯一的，理想情况下，它们在密码上是随机的。 它们不必是私密的：IV 通常只是添加到未加密的密文消息中。 它们必须是不可预测的且唯一的，但不一定是私密的，这听起来似乎是矛盾的。 记住，攻击者必须无法提前预测给定的 IV 将会是什么。

### crypto.createDecipher(algorithm, password[, options])

稳定性: 0 - 废弃: 改为使用 crypto.createDecipheriv() 。

* algorithm <string>
* password <string> | <Buffer> | <TypedArray> | <DataView>
* options <Object> stream.transform options
* Returns: <Decipher>

Creates and returns a Decipher object that uses the given algorithm and password (key).

The options argument controls stream behavior and is optional except when a cipher in CCM or OCB mode is used (e.g. 'aes-128-ccm'). In that case, the authTagLength option is required and specifies the length of the authentication tag in bytes, see CCM mode.

The implementation of crypto.createDecipher() derives keys using the OpenSSL function EVP_BytesToKey with the digest algorithm set to MD5, one iteration, and no salt. The lack of salt allows dictionary attacks as the same password always creates the same key. The low iteration count and non-cryptographically secure hash algorithm allow passwords to be tested very rapidly.

In line with OpenSSL's recommendation to use a more modern algorithm instead of EVP_BytesToKey it is recommended that developers derive a key and IV on their own using crypto.scrypt() and to use crypto.createDecipheriv() to create the Decipher object.

### crypto.createDecipheriv(algorithm, key, iv[, options])

* algorithm <string>
* key <string> | <Buffer> | <TypedArray> | <DataView> | <KeyObject>
* iv <string> | <Buffer> | <TypedArray> | <DataView> | <null>
* options <Object> stream.transform 的选项。
* 返回: <Decipher>

使用给定的 algorithm、 key 和初始化向量（iv）创建并返回一个 Decipher 对象。

options 参数控制流的行为，它是可选的，除非使用 CCM 或 OCB 模式的密码（例如 'aes-128-ccm'）。 在这种情况下，必须使用 authTagLength 选项，并以字节为单位指定身份验证标签的长度，参阅 CCM 模式。 在 GCM 模式中，不需要 authTagLength 选项，但可用于将接受的身份验证标签限制为具有指定的长度。

algorithm 取决于 OpenSSL，例如 'aes192' 等。 在 OpenSSL 的最新版本中， openssl list -cipher-algorithms（在较旧版本的 OpenSSL 中是 openssl list-cipher-algorithms）将会显示可用的密码算法。

key 是 algorithm 使用的原始密钥， iv 是初始化向量。 两个参数都必须是 'utf8' 编码的字符串、Buffer、 TypedArray 或 DataView。 key 可以是 secret 类型的 KeyObject。 如果密码不需要初始化向量，则 iv 可以为 null。

初始化向量应该是不可预测的且唯一的，理想情况下，它们在密码上是随机的。 它们不必是私密的：IV 通常只是添加到未加密的密文消息中。 它们必须是不可预测的且唯一的，但不一定是私密的，这听起来似乎是矛盾的。 记住，攻击者必须无法提前预测给定的 IV 将会是什么。

### crypto.createDiffieHellman(prime[, primeEncoding][, generator][, generatorEncoding])

* prime <string> | <Buffer> | <TypedArray> | <DataView>
* primeEncoding <string> The encoding of the prime string.
* generator <number> | <string> | <Buffer> | <TypedArray> | <DataView> Default: 2
* generatorEncoding <string> The encoding of the generator string.
* Returns: <DiffieHellman>

Creates a DiffieHellman key exchange object using the supplied prime and an optional specific generator.

The generator argument can be a number, string, or Buffer. If generator is not specified, the value 2 is used.

If primeEncoding is specified, prime is expected to be a string; otherwise a Buffer, TypedArray, or DataView is expected.

If generatorEncoding is specified, generator is expected to be a string; otherwise a number, Buffer, TypedArray, or DataView is expected.

### crypto.createDiffieHellman(primeLength[, generator])

* primeLength <number>
* generator <number> | <string> | <Buffer> | <TypedArray> | <DataView> Default: 2
* Returns: <DiffieHellman>

Creates a DiffieHellman key exchange object and generates a prime of primeLength bits using an optional specific numeric generator. If generator is not specified, the value 2 is used.

### crypto.createDiffieHellmanGroup(name)

* name <string>
* Returns: <DiffieHellmanGroup>

An alias for crypto.getDiffieHellman()

### crypto.createECDH(curveName)

* curveName <string>
* Returns: <ECDH>

Creates an Elliptic Curve Diffie-Hellman (ECDH) key exchange object using a predefined curve specified by the curveName string. Use crypto.getCurves() to obtain a list of available curve names. On recent OpenSSL releases, openssl ecparam -list_curves will also display the name and description of each available elliptic curve.

### crypto.createHash(algorithm[, options])

* algorithm <string>
* options <Object> stream.transform 的选项。
* 返回: <Hash>

创建并返回一个 Hash 对象，该对象可用于生成哈希摘要（使用给定的 algorithm）。 可选的 options 参数控制流的行为。 对于 XOF 哈希函数（例如 'shake256'）， outputLength 选项可用于指定所需的输出长度（以字节为单位）。

algorithm 取决于平台上的 OpenSSL 的版本所支持的可用算法。 例如 'sha256'、 'sha512' 等。 在 OpenSSL 的最新版本中， openssl list -digest-algorithms（在较旧版本的 OpenSSL 中是 openssl list-message-digest-algorithms）将会显示可用的摘要算法。

示例，生成一个文件的 sha256 总和：

```js
const filename = process.argv[2];
const crypto = require('crypto');
const fs = require('fs');

const hash = crypto.createHash('sha256');

const input = fs.createReadStream(filename);
input.on('readable', () => {
  // 哈希流只会生成一个元素。
  const data = input.read();
  if (data)
    hash.update(data);
  else {
    console.log(`${hash.digest('hex')} ${filename}`);
  }
});
```

### crypto.createHmac(algorithm, key[, options])

* algorithm <string>
* key <string> | <Buffer> | <TypedArray> | <DataView> | <KeyObject>
* options <Object> stream.transform 的选项。
* 返回: <Hmac>

创建并返回一个 Hmac 对象，该对象使用给定的 algorithm 和 key。 可选的 options 参数控制流的行为。

algorithm 取决于平台上的 OpenSSL 的版本所支持的可用算法。 例如 'sha256'、 'sha512' 等。 在 OpenSSL 的最新版本中， openssl list -digest-algorithms（在较旧版本的 OpenSSL 中是 openssl list-message-digest-algorithms）将会显示可用的摘要算法。

key 是用于生成加密的 HMAC 哈希的 HMAC 密钥。 如果它是一个 KeyObject，则其类型必须是 secret。

示例，生成一个文件的 sha256 HMAC：

```js
const filename = process.argv[2];
const crypto = require('crypto');
const fs = require('fs');

const hmac = crypto.createHmac('sha256', '密钥');

const input = fs.createReadStream(filename);
input.on('readable', () => {
  // 哈希流只会生成一个元素。
  const data = input.read();
  if (data)
    hmac.update(data);
  else {
    console.log(`${hmac.digest('hex')} ${filename}`);
  }
});
```

### crypto.createPrivateKey(key)

* key <Object> | <string> | <Buffer>
    * key: <string> | <Buffer> The key material, either in PEM or DER format.
    * format: <string> Must be 'pem' or 'der'. Default: 'pem'.
    * type: <string> Must be 'pkcs1', 'pkcs8' or 'sec1'. This option is required only if the format is 'der' and ignored if it is 'pem'.
    * passphrase: <string> | <Buffer> The passphrase to use for decryption.
* Returns: <KeyObject>

Creates and returns a new key object containing a private key. If key is a string or Buffer, format is assumed to be 'pem'; otherwise, key must be an object with the properties described above.

If the private key is encrypted, a passphrase must be specified. The length of the passphrase is limited to 1024 bytes.

### crypto.createPublicKey(key)

* key <Object> | <string> | <Buffer> | <KeyObject>
    * key: <string> | <Buffer>
    * format: <string> Must be 'pem' or 'der'. Default: 'pem'.
    * type: <string> Must be 'pkcs1' or 'spki'. This option is required only if the format is 'der'.
* Returns: <KeyObject>

Creates and returns a new key object containing a public key. If key is a string or Buffer, format is assumed to be 'pem'; if key is a KeyObject with type 'private', the public key is derived from the given private key; otherwise, key must be an object with the properties described above.

If the format is 'pem', the 'key' may also be an X.509 certificate.

Because public keys can be derived from private keys, a private key may be passed instead of a public key. In that case, this function behaves as if crypto.createPrivateKey() had been called, except that the type of the returned KeyObject will be 'public' and that the private key cannot be extracted from the returned KeyObject. Similarly, if a KeyObject with type 'private' is given, a new KeyObject with type 'public' will be returned and it will be impossible to extract the private key from the returned object.

### crypto.createSecretKey(key)

* key <Buffer>
* Returns: <KeyObject>

Creates and returns a new key object containing a secret key for symmetric encryption or Hmac.

### crypto.createSign(algorithm[, options])

* algorithm <string>
* options <Object> stream.Writable options
* Returns: <Sign>

Creates and returns a Sign object that uses the given algorithm. Use crypto.getHashes() to obtain the names of the available digest algorithms. Optional options argument controls the stream.Writable behavior.

In some cases, a Sign instance can be created using the name of a signature algorithm, such as 'RSA-SHA256', instead of a digest algorithm. This will use the corresponding digest algorithm. This does not work for all signature algorithms, such as 'ecdsa-with-SHA256', so it is best to always use digest algorithm names.

### crypto.createVerify(algorithm[, options])

* algorithm <string>
* options <Object> stream.Writable options
* Returns: <Verify>

Creates and returns a Verify object that uses the given algorithm. Use crypto.getHashes() to obtain an array of names of the available signing algorithms. Optional options argument controls the stream.Writable behavior.

In some cases, a Verify instance can be created using the name of a signature algorithm, such as 'RSA-SHA256', instead of a digest algorithm. This will use the corresponding digest algorithm. This does not work for all signature algorithms, such as 'ecdsa-with-SHA256', so it is best to always use digest algorithm names.

### crypto.generateKeyPair(type, options, callback)

* type: <string> Must be 'rsa', 'dsa', 'ec', 'ed25519', 'ed448', 'x25519', or 'x448'.
* options: <Object>
    * modulusLength: <number> Key size in bits (RSA, DSA).
    * publicExponent: <number> Public exponent (RSA). Default: 0x10001.
    * divisorLength: <number> Size of q in bits (DSA).
    * namedCurve: <string> Name of the curve to use (EC).
    * publicKeyEncoding: <Object> See keyObject.export().
    * privateKeyEncoding: <Object> See keyObject.export().
* callback: <Function>
    * err: <Error>
    * publicKey: <string> | <Buffer> | <KeyObject>
    * privateKey: <string> | <Buffer> | <KeyObject>

Generates a new asymmetric key pair of the given type. RSA, DSA, EC, Ed25519 and Ed448 are currently supported.

If a publicKeyEncoding or privateKeyEncoding was specified, this function behaves as if keyObject.export() had been called on its result. Otherwise, the respective part of the key is returned as a KeyObject.

It is recommended to encode public keys as 'spki' and private keys as 'pkcs8' with encryption for long-term storage:

```js
const { generateKeyPair } = require('crypto');
generateKeyPair('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: 'top secret'
  }
}, (err, publicKey, privateKey) => {
  // Handle errors and use the generated key pair.
});
```

On completion, callback will be called with err set to undefined and publicKey / privateKey representing the generated key pair.

If this method is invoked as its util.promisify()ed version, it returns a Promise for an Object with publicKey and privateKey properties.

### crypto.generateKeyPairSync(type, options)

* type: <string> Must be 'rsa', 'dsa', 'ec', 'ed25519', or 'ed448'.
* options: <Object>
    * modulusLength: <number> Key size in bits (RSA, DSA).
    * publicExponent: <number> Public exponent (RSA). Default: 0x10001.
    * divisorLength: <number> Size of q in bits (DSA).
    * namedCurve: <string> Name of the curve to use (EC).
    * publicKeyEncoding: <Object> See keyObject.export().
    * privateKeyEncoding: <Object> See keyObject.export().
* Returns: <Object>
    * publicKey: <string> | <Buffer> | <KeyObject>
    * privateKey: <string> | <Buffer> | <KeyObject>

Generates a new asymmetric key pair of the given type. RSA, DSA, EC, Ed25519 and Ed448 are currently supported.

If a publicKeyEncoding or privateKeyEncoding was specified, this function behaves as if keyObject.export() had been called on its result. Otherwise, the respective part of the key is returned as a KeyObject.

When encoding public keys, it is recommended to use 'spki'. When encoding private keys, it is recommended to use 'pks8' with a strong passphrase, and to keep the passphrase confidential.

```js
const { generateKeyPairSync } = require('crypto');
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: 'top secret'
  }
});
```

The return value { publicKey, privateKey } represents the generated key pair. When PEM encoding was selected, the respective key will be a string, otherwise it will be a buffer containing the data encoded as DER.

### crypto.getCiphers()

* Returns: <string[]> An array with the names of the supported cipher algorithms.

```js
const ciphers = crypto.getCiphers();
console.log(ciphers); // ['aes-128-cbc', 'aes-128-ccm', ...]
```

### crypto.getCurves()

* Returns: <string[]> An array with the names of the supported elliptic curves.

```js
const curves = crypto.getCurves();
console.log(curves); // ['Oakley-EC2N-3', 'Oakley-EC2N-4', ...]
```

### crypto.getDiffieHellman(groupName)

* groupName <string>
* Returns: <DiffieHellmanGroup>

Creates a predefined DiffieHellmanGroup key exchange object. The supported groups are: 'modp1', 'modp2', 'modp5' (defined in RFC 2412, but see Caveats) and 'modp14', 'modp15', 'modp16', 'modp17', 'modp18' (defined in RFC 3526). The returned object mimics the interface of objects created by crypto.createDiffieHellman(), but will not allow changing the keys (with diffieHellman.setPublicKey(), for example). The advantage of using this method is that the parties do not have to generate nor exchange a group modulus beforehand, saving both processor and communication time.

Example (obtaining a shared secret):

```js
const crypto = require('crypto');
const alice = crypto.getDiffieHellman('modp14');
const bob = crypto.getDiffieHellman('modp14');

alice.generateKeys();
bob.generateKeys();

const aliceSecret = alice.computeSecret(bob.getPublicKey(), null, 'hex');
const bobSecret = bob.computeSecret(alice.getPublicKey(), null, 'hex');

/* aliceSecret and bobSecret should be the same */
console.log(aliceSecret === bobSecret);
```

### crypto.getFips()

* Returns: <boolean> true if and only if a FIPS compliant crypto provider is currently in use.

### crypto.getHashes()

* Returns: <string[]> An array of the names of the supported hash algorithms, such as 'RSA-SHA256'. Hash algorithms are also called "digest" algorithms.

```js
const hashes = crypto.getHashes();
console.log(hashes); // ['DSA', 'DSA-SHA', 'DSA-SHA1', ...]
```

### crypto.pbkdf2(password, salt, iterations, keylen, digest, callback)

* password <string> | <Buffer> | <TypedArray> | <DataView>
* salt <string> | <Buffer> | <TypedArray> | <DataView>
* iterations <number>
* keylen <number>
* digest <string>
* callback <Function>
    * err <Error>
    * derivedKey <Buffer>

Provides an asynchronous Password-Based Key Derivation Function 2 (PBKDF2) implementation. A selected HMAC digest algorithm specified by digest is applied to derive a key of the requested byte length (keylen) from the password, salt and iterations.

The supplied callback function is called with two arguments: err and derivedKey. If an error occurs while deriving the key, err will be set; otherwise err will be null. By default, the successfully generated derivedKey will be passed to the callback as a Buffer. An error will be thrown if any of the input arguments specify invalid values or types.

If digest is null, 'sha1' will be used. This behavior is deprecated, please specify a digest explicitly.

The iterations argument must be a number set as high as possible. The higher the number of iterations, the more secure the derived key will be, but will take a longer amount of time to complete.

The salt should be as unique as possible. It is recommended that a salt is random and at least 16 bytes long. See NIST SP 800-132 for details.

```js
const crypto = require('crypto');
crypto.pbkdf2('secret', 'salt', 100000, 64, 'sha512', (err, derivedKey) => {
  if (err) throw err;
  console.log(derivedKey.toString('hex'));  // '3745e48...08d59ae'
});
```

The crypto.DEFAULT_ENCODING property can be used to change the way the derivedKey is passed to the callback. This property, however, has been deprecated and use should be avoided.

```js
const crypto = require('crypto');
crypto.DEFAULT_ENCODING = 'hex';
crypto.pbkdf2('secret', 'salt', 100000, 512, 'sha512', (err, derivedKey) => {
  if (err) throw err;
  console.log(derivedKey);  // '3745e48...aa39b34'
});
```

An array of supported digest functions can be retrieved using crypto.getHashes().

This API uses libuv's threadpool, which can have surprising and negative performance implications for some applications; see the UV_THREADPOOL_SIZE documentation for more information.

### crypto.pbkdf2Sync(password, salt, iterations, keylen, digest)

* password <string> | <Buffer> | <TypedArray> | <DataView>
* salt <string> | <Buffer> | <TypedArray> | <DataView>
* iterations <number>
* keylen <number>
* digest <string>
* Returns: <Buffer>

Provides a synchronous Password-Based Key Derivation Function 2 (PBKDF2) implementation. A selected HMAC digest algorithm specified by digest is applied to derive a key of the requested byte length (keylen) from the password, salt and iterations.

If an error occurs an Error will be thrown, otherwise the derived key will be returned as a Buffer.

If digest is null, 'sha1' will be used. This behavior is deprecated, please specify a digest explicitly.

The iterations argument must be a number set as high as possible. The higher the number of iterations, the more secure the derived key will be, but will take a longer amount of time to complete.

The salt should be as unique as possible. It is recommended that a salt is random and at least 16 bytes long. See NIST SP 800-132 for details.

```js
const crypto = require('crypto');
const key = crypto.pbkdf2Sync('secret', 'salt', 100000, 64, 'sha512');
console.log(key.toString('hex'));  // '3745e48...08d59ae'
```

The crypto.DEFAULT_ENCODING property may be used to change the way the derivedKey is returned. This property, however, is deprecated and use should be avoided.

```js
const crypto = require('crypto');
crypto.DEFAULT_ENCODING = 'hex';
const key = crypto.pbkdf2Sync('secret', 'salt', 100000, 512, 'sha512');
console.log(key);  // '3745e48...aa39b34'
```

An array of supported digest functions can be retrieved using crypto.getHashes().

### crypto.privateDecrypt(privateKey, buffer)

* privateKey <Object> | <string> | <Buffer> | <KeyObject>
    * oaepHash <string> The hash function to use for OAEP padding. Default: 'sha1'
    * padding <crypto.constants> An optional padding value defined in crypto.constants, which may be: crypto.constants.RSA_NO_PADDING, crypto.constants.RSA_PKCS1_PADDING, or crypto.constants.RSA_PKCS1_OAEP_PADDING.
* buffer <Buffer> | <TypedArray> | <DataView>
* Returns: <Buffer> A new Buffer with the decrypted content.

Decrypts buffer with privateKey. buffer was previously encrypted using the corresponding public key, for example using crypto.publicEncrypt().

If privateKey is not a KeyObject, this function behaves as if privateKey had been passed to crypto.createPrivateKey(). If it is an object, the padding property can be passed. Otherwise, this function uses RSA_PKCS1_OAEP_PADDING.

### crypto.privateEncrypt(privateKey, buffer)

* privateKey <Object> | <string> | <Buffer> | <KeyObject>
    * key <string> | <Buffer> | <KeyObject> A PEM encoded private key.
    * passphrase <string> | <Buffer> An optional passphrase for the private key.
    * padding <crypto.constants> An optional padding value defined in crypto.constants, which may be: crypto.constants.RSA_NO_PADDING or crypto.constants.RSA_PKCS1_PADDING.
* buffer <Buffer> | <TypedArray> | <DataView>
* Returns: <Buffer> A new Buffer with the encrypted content.

Encrypts buffer with privateKey. The returned data can be decrypted using the corresponding public key, for example using crypto.publicDecrypt().

If privateKey is not a KeyObject, this function behaves as if privateKey had been passed to crypto.createPrivateKey(). If it is an object, the padding property can be passed. Otherwise, this function uses RSA_PKCS1_PADDING.

### crypto.publicDecrypt(key, buffer)

* key <Object> | <string> | <Buffer> | <KeyObject>
    * passphrase <string> | <Buffer> An optional passphrase for the private key.
    * padding <crypto.constants> An optional padding value defined in crypto.constants, which may be: crypto.constants.RSA_NO_PADDING or crypto.constants.RSA_PKCS1_PADDING.
* buffer <Buffer> | <TypedArray> | <DataView>
* Returns: <Buffer> A new Buffer with the decrypted content.

Decrypts buffer with key.buffer was previously encrypted using the corresponding private key, for example using crypto.privateEncrypt().

If key is not a KeyObject, this function behaves as if key had been passed to crypto.createPublicKey(). If it is an object, the padding property can be passed. Otherwise, this function uses RSA_PKCS1_PADDING.

Because RSA public keys can be derived from private keys, a private key may be passed instead of a public key.

### crypto.publicEncrypt(key, buffer)

* key <Object> | <string> | <Buffer> | <KeyObject>
    * key <string> | <Buffer> | <KeyObject> A PEM encoded public or private key.
    * oaepHash <string> The hash function to use for OAEP padding. Default: 'sha1'
    * passphrase <string> | <Buffer> An optional passphrase for the private key.
    * padding <crypto.constants> An optional padding value defined in crypto.constants, which may be: crypto.constants.RSA_NO_PADDING, crypto.constants.RSA_PKCS1_PADDING, or crypto.constants.RSA_PKCS1_OAEP_PADDING.
* buffer <Buffer> | <TypedArray> | <DataView>
* Returns: <Buffer> A new Buffer with the encrypted content.

Encrypts the content of buffer with key and returns a new Buffer with encrypted content. The returned data can be decrypted using the corresponding private key, for example using crypto.privateDecrypt().

If key is not a KeyObject, this function behaves as if key had been passed to crypto.createPublicKey(). If it is an object, the padding property can be passed. Otherwise, this function uses RSA_PKCS1_OAEP_PADDING.

Because RSA public keys can be derived from private keys, a private key may be passed instead of a public key.

### crypto.randomBytes(size[, callback])

* size <number>
* callback <Function>
    * err <Error>
    * buf <Buffer>
* 返回: <Buffer> 如果未提供 callback 函数。

生成加密强伪随机数据。 size 参数是指示要生成的字节数的数值。

如果提供 callback 函数，则这些字节是异步生成的并且使用两个参数调用 callback 函数：err 和 buf。 如果发生错误，则 err 是一个 Error 对象，否则为 null。 buf 参数是包含生成字节的 Buffer。

```js
// 异步的。
const crypto = require('crypto');
crypto.randomBytes(256, (err, buf) => {
  if (err) throw err;
  console.log(`${buf.length} 位的随机数据: ${buf.toString('hex')}`);
});
```

如果未提供 callback 函数，则同步地生成随机字节并返回为 Buffer。 如果生成字节遇到问题，将会抛出一个错误。

```js
// 同步的。
const buf = crypto.randomBytes(256);
console.log(
  `${buf.length} 位的随机数据: ${buf.toString('hex')}`);
```

crypto.randomBytes() 方法将在获得足够的熵之后完成。 这通常不会超过几毫秒。 只有在刚开启时才可能会阻塞更久，因为此时整个系统的熵不多。

这个 API 使用 libuv 的线程池，所以在某些时候可能会产生意外的性能问题，查看 UV_THREADPOOL_SIZE 的文档以了解更多信息。

crypto.randomBytes() 的异步版本在单个线程池请求中执行。 要最小化线程池任务长度变化，请在执行此操作时对大型的 randomBytes 请求进行分区，以完成客户端请求。

### crypto.randomFillSync(buffer[, offset][, size])

* buffer <Buffer> | <TypedArray> | <DataView> Must be supplied.
* offset <number> Default: 0
* size <number> Default: buffer.length - offset
* Returns: <Buffer> | <TypedArray> | <DataView> The object passed as buffer argument.

Synchronous version of crypto.randomFill().

```js
const buf = Buffer.alloc(10);
console.log(crypto.randomFillSync(buf).toString('hex'));

crypto.randomFillSync(buf, 5);
console.log(buf.toString('hex'));

// The above is equivalent to the following:
crypto.randomFillSync(buf, 5, 5);
console.log(buf.toString('hex'));
```

Any TypedArray or DataView instance may be passed as buffer.

```js
const a = new Uint32Array(10);
console.log(Buffer.from(crypto.randomFillSync(a).buffer,
                        a.byteOffset, a.byteLength).toString('hex'));

const b = new Float64Array(10);
console.log(Buffer.from(crypto.randomFillSync(b).buffer,
                        b.byteOffset, b.byteLength).toString('hex'));

const c = new DataView(new ArrayBuffer(10));
console.log(Buffer.from(crypto.randomFillSync(c).buffer,
                        c.byteOffset, c.byteLength).toString('hex'));
```

### crypto.randomFill(buffer[, offset][, size], callback)

* buffer <Buffer> | <TypedArray> | <DataView> Must be supplied.
* offset <number> Default: 0
* size <number> Default: buffer.length - offset
* callback <Function> function(err, buf) {}.

This function is similar to crypto.randomBytes() but requires the first argument to be a Buffer that will be filled. It also requires that a callback is passed in.

If the callback function is not provided, an error will be thrown.

```js
const buf = Buffer.alloc(10);
crypto.randomFill(buf, (err, buf) => {
  if (err) throw err;
  console.log(buf.toString('hex'));
});

crypto.randomFill(buf, 5, (err, buf) => {
  if (err) throw err;
  console.log(buf.toString('hex'));
});

// The above is equivalent to the following:
crypto.randomFill(buf, 5, 5, (err, buf) => {
  if (err) throw err;
  console.log(buf.toString('hex'));
});
```

Any TypedArray or DataView instance may be passed as buffer.

```js
const a = new Uint32Array(10);
crypto.randomFill(a, (err, buf) => {
  if (err) throw err;
  console.log(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength)
    .toString('hex'));
});

const b = new Float64Array(10);
crypto.randomFill(b, (err, buf) => {
  if (err) throw err;
  console.log(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength)
    .toString('hex'));
});

const c = new DataView(new ArrayBuffer(10));
crypto.randomFill(c, (err, buf) => {
  if (err) throw err;
  console.log(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength)
    .toString('hex'));
});
```

This API uses libuv's threadpool, which can have surprising and negative performance implications for some applications; see the UV_THREADPOOL_SIZE documentation for more information.

The asynchronous version of crypto.randomFill() is carried out in a single threadpool request. To minimize threadpool task length variation, partition large randomFill requests when doing so as part of fulfilling a client request.

### crypto.scrypt(password, salt, keylen[, options], callback)

* password <string> | <Buffer> | <TypedArray> | <DataView>
* salt <string> | <Buffer> | <TypedArray> | <DataView>
* keylen <number>
* options <Object>
    * cost <number> CPU 或内存的成本参数。必须是 2 的次方且大于1。默认值: 16384。
    * blockSize <number> 块大小参数。默认值: 8。
    * parallelization <number> 并行化参数。默认值: 1。
    * N <number> cost 的别名。只能指定两者之一。
    * r <number> blockSize 的别名。只能指定两者之一。
    * p <number> parallelization 的别名。只能指定两者之一。
    * maxmem <number> 内存的上限。当（大约） 128 * N * r > maxmem 时是错误的。默认值: 32 * 1024 * 1024。
* callback <Function>
    * err <Error>
    * derivedKey <Buffer>

提供异步的 scrypt 实现。 Scrypt 是一个基于密码的密钥派生函数，被设计为在计算和内存方面都非常高成本，目的是使暴力破解无法成功。

salt 应尽可能独特。 建议盐值是随机的并且至少 16 个字节长。 有关详细信息，请参阅 NIST SP 800-132。

callback 函数有两个参数：err 和 derivedKey。 当密钥派生失败时， err 是一个异常对象，否则 err 为 null。 derivedKey 会作为 Buffer 传给回调。

当任何的输入参数指定了无效的值或类型时，会抛出异常。

```js
const crypto = require('crypto');
// 使用出厂默认值。
crypto.scrypt('密码', '盐值', 64, (err, derivedKey) => {
  if (err) throw err;
  console.log(derivedKey.toString('hex'));  // '00d9e09...8a4f15a'
});
// 使用自定义的 N 参数。必须是 2 的次方。
crypto.scrypt('密码', '盐值', 64, { N: 1024 }, (err, derivedKey) => {
  if (err) throw err;
  console.log(derivedKey.toString('hex'));  // 'f710b45...f04e377'
});
```

### crypto.scryptSync(password, salt, keylen[, options])

* password <string> | <Buffer> | <TypedArray> | <DataView>
* salt <string> | <Buffer> | <TypedArray> | <DataView>
* keylen <number>
* options <Object>
    * cost <number> CPU 或内存的成本参数。必须是 2 的次方且大于1。默认值: 16384。
    * blockSize <number> 块大小参数。默认值: 8。
    * parallelization <number> 并行化参数。默认值: 1。
    * N <number> cost 的别名。只能指定两者之一。
    * r <number> blockSize 的别名。只能指定两者之一。
    * p <number> parallelization 的别名。只能指定两者之一。
    * maxmem <number> 内存的上限。当（大约） 128 * N * r > maxmem 时是错误的。默认值: 32 * 1024 * 1024。
* 返回: <Buffer>

提供同步的 scrypt 实现。 Scrypt 是一个基于密码的密钥派生函数，被设计为在计算和内存方面都非常高成本，目的是使暴力破解无法成功。

salt 应尽可能独特。 建议盐值是随机的并且至少 16 个字节长。 有关详细信息，请参阅 NIST SP 800-132。

当密钥派生失败时，会抛出异常，否则派生的密钥会作为 Buffer 返回。

当任何的输入参数指定了无效的值或类型时，会抛出异常。

```js
const crypto = require('crypto');
// 使用出厂默认值。
const key1 = crypto.scryptSync('密码', '盐值', 64);
console.log(key1.toString('hex'));  // '00d9e09...8a4f15a'
// 使用自定义的 N 参数。必须是 2 的次方。
const key2 = crypto.scryptSync('密码', '盐值', 64, { N: 1024 });
console.log(key2.toString('hex'));  // 'f710b45...f04e377'
```

### crypto.setEngine(engine[, flags])

* engine <string>
* flags <crypto.constants> Default: crypto.constants.ENGINE_METHOD_ALL
Load and set the engine for some or all OpenSSL functions (selected by flags).

engine could be either an id or a path to the engine's shared library.

The optional flags argument uses ENGINE_METHOD_ALL by default. The flags is a bit field taking one of or a mix of the following flags (defined in crypto.constants):

* crypto.constants.ENGINE_METHOD_RSA
* crypto.constants.ENGINE_METHOD_DSA
* crypto.constants.ENGINE_METHOD_DH
* crypto.constants.ENGINE_METHOD_RAND
* crypto.constants.ENGINE_METHOD_EC
* crypto.constants.ENGINE_METHOD_CIPHERS
* crypto.constants.ENGINE_METHOD_DIGESTS
* crypto.constants.ENGINE_METHOD_PKEY_METHS
* crypto.constants.ENGINE_METHOD_PKEY_ASN1_METHS
* crypto.constants.ENGINE_METHOD_ALL
* crypto.constants.ENGINE_METHOD_NONE

The flags below are deprecated in OpenSSL-1.1.0.

* crypto.constants.ENGINE_METHOD_ECDH
* crypto.constants.ENGINE_METHOD_ECDSA
* crypto.constants.ENGINE_METHOD_STORE

### crypto.setFips(bool)

* bool <boolean> true to enable FIPS mode.

Enables the FIPS compliant crypto provider in a FIPS-enabled Node.js build. Throws an error if FIPS mode is not available.

### crypto.sign(algorithm, data, key)

* algorithm <string> | <null> | <undefined>
* data <Buffer> | <TypedArray> | <DataView>
* key <Object> | <string> | <Buffer> | <KeyObject>
* Returns: <Buffer>

Calculates and returns the signature for data using the given private key and algorithm. If algorithm is null or undefined, then the algorithm is dependent upon the key type (especially Ed25519 and Ed448).

If key is not a KeyObject, this function behaves as if key had been passed to crypto.createPrivateKey(). If it is an object, the following additional properties can be passed:

* padding <integer> Optional padding value for RSA, one of the following:
    * crypto.constants.RSA_PKCS1_PADDING (default)
    * crypto.constants.RSA_PKCS1_PSS_PADDING

RSA_PKCS1_PSS_PADDING will use MGF1 with the same hash function used to sign the message as specified in section 3.1 of RFC 4055.

* saltLength <integer> Salt length for when padding is RSA_PKCS1_PSS_PADDING. The special value crypto.constants.RSA_PSS_SALTLEN_DIGEST sets the salt length to the digest size, crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN (default) sets it to the maximum permissible value.

### crypto.timingSafeEqual(a, b)

* a <Buffer> | <TypedArray> | <DataView>
* b <Buffer> | <TypedArray> | <DataView>
* Returns: <boolean>

This function is based on a constant-time algorithm. Returns true if a is equal to b, without leaking timing information that would allow an attacker to guess one of the values. This is suitable for comparing HMAC digests or secret values like authentication cookies or capability urls.

a and b must both be Buffers, TypedArrays, or DataViews, and they must have the same length.

Use of crypto.timingSafeEqual does not guarantee that the surrounding code is timing-safe. Care should be taken to ensure that the surrounding code does not introduce timing vulnerabilities.

### crypto.verify(algorithm, data, key, signature)

* algorithm <string> | <null> | <undefined>
* data <Buffer> | <TypedArray> | <DataView>
* key <Object> | <string> | <Buffer> | <KeyObject>
* signature <Buffer> | <TypedArray> | <DataView>
* Returns: <boolean>

Verifies the given signature for data using the given key and algorithm. If algorithm is null or undefined, then the algorithm is dependent upon the key type (especially Ed25519 and Ed448).

If key is not a KeyObject, this function behaves as if key had been passed to crypto.createPublicKey(). If it is an object, the following additional properties can be passed:

* padding <integer> Optional padding value for RSA, one of the following:
    * crypto.constants.RSA_PKCS1_PADDING (default)
    * crypto.constants.RSA_PKCS1_PSS_PADDING

RSA_PKCS1_PSS_PADDING will use MGF1 with the same hash function used to sign the message as specified in section 3.1 of RFC 4055.

* saltLength <integer> Salt length for when padding is RSA_PKCS1_PSS_PADDING. The special value crypto.constants.RSA_PSS_SALTLEN_DIGEST sets the salt length to the digest size, crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN (default) sets it to the maximum permissible value.

The signature argument is the previously calculated signature for the data.

Because public keys can be derived from private keys, a private key or a public key may be passed for key.

## 注意事项

### 遗留的 stream 接口（Node.js v0.10 之前）

The Crypto module was added to Node.js before there was the concept of a unified Stream API, and before there were Buffer objects for handling binary data. As such, the many of the crypto defined classes have methods not typically found on other Node.js classes that implement the streams API (e.g. update(), final(), or digest()). Also, many methods accepted and returned 'latin1' encoded strings by default rather than Buffers. This default was changed after Node.js v0.8 to use Buffer objects by default instead.

### ECDH 近期的变化

Usage of ECDH with non-dynamically generated key pairs has been simplified. Now, ecdh.setPrivateKey() can be called with a preselected private key and the associated public point (key) will be computed and stored in the object. This allows code to only store and provide the private part of the EC key pair. ecdh.setPrivateKey() now also validates that the private key is valid for the selected curve.

The ecdh.setPublicKey() method is now deprecated as its inclusion in the API is not useful. Either a previously stored private key should be set, which automatically generates the associated public key, or ecdh.generateKeys() should be called. The main drawback of using ecdh.setPublicKey() is that it can be used to put the ECDH key pair into an inconsistent state.

### 弱加密算法的支持

The crypto module still supports some algorithms which are already compromised and are not currently recommended for use. The API also allows the use of ciphers and hashes with a small key size that are too weak for safe use.

Users should take full responsibility for selecting the crypto algorithm and key size according to their security requirements.

Based on the recommendations of NIST SP 800-131A:

* MD5 and SHA-1 are no longer acceptable where collision resistance is required such as digital signatures.
* The key used with RSA, DSA, and DH algorithms is recommended to have at least 2048 bits and that of the curve of ECDSA and ECDH at least 224 bits, to be safe to use for several years.
* The DH groups of modp1, modp2 and modp5 have a key size smaller than 2048 bits and are not recommended.

See the reference for other recommendations and details.

### CCM 模式

CCM is one of the supported AEAD algorithms. Applications which use this mode must adhere to certain restrictions when using the cipher API:

* The authentication tag length must be specified during cipher creation by setting the authTagLength option and must be one of 4, 6, 8, 10, 12, 14 or 16 bytes.
* The length of the initialization vector (nonce) N must be between 7 and 13 bytes (7 ≤ N ≤ 13).
* The length of the plaintext is limited to 2 ** (8 * (15 - N)) bytes.
* When decrypting, the authentication tag must be set via setAuthTag() before calling update(). Otherwise, decryption will fail and final() will throw an error in compliance with section 2.6 of RFC 3610.
* Using stream methods such as write(data), end(data) or pipe() in CCM mode might fail as CCM cannot handle more than one chunk of data per instance.
* When passing additional authenticated data (AAD), the length of the actual message in bytes must be passed to setAAD() via the plaintextLength option. This is not necessary if no AAD is used.
* As CCM processes the whole message at once, update() can only be called once.
* Even though calling update() is sufficient to encrypt/decrypt the message, applications must call final() to compute or verify the authentication tag.

```js
const crypto = require('crypto');

const key = 'keykeykeykeykeykeykeykey';
const nonce = crypto.randomBytes(12);

const aad = Buffer.from('0123456789', 'hex');

const cipher = crypto.createCipheriv('aes-192-ccm', key, nonce, {
  authTagLength: 16
});
const plaintext = 'Hello world';
cipher.setAAD(aad, {
  plaintextLength: Buffer.byteLength(plaintext)
});
const ciphertext = cipher.update(plaintext, 'utf8');
cipher.final();
const tag = cipher.getAuthTag();

// Now transmit { ciphertext, nonce, tag }.

const decipher = crypto.createDecipheriv('aes-192-ccm', key, nonce, {
  authTagLength: 16
});
decipher.setAuthTag(tag);
decipher.setAAD(aad, {
  plaintextLength: ciphertext.length
});
const receivedPlaintext = decipher.update(ciphertext, null, 'utf8');

try {
  decipher.final();
} catch (err) {
  console.error('Authentication failed!');
  return;
}

console.log(receivedPlaintext);
```

## crypto 常量

The following constants exported by crypto.constants apply to various uses of the crypto, tls, and https modules and are generally specific to OpenSSL.

### OpenSSL 选项

Constant | Description
- | -
SSL_OP_ALL | Applies multiple bug workarounds within OpenSSL. See https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html for detail.
SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION | Allows legacy insecure renegotiation between OpenSSL and unpatched clients or servers. See https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html.
SSL_OP_CIPHER_SERVER_PREFERENCE | Attempts to use the server's preferences instead of the client's when selecting a cipher. Behavior depends on protocol version. See https://www.openssl.org/docs/man1.0.2/ssl/SSL_CTX_set_options.html.
SSL_OP_CISCO_ANYCONNECT | Instructs OpenSSL to use Cisco's "speshul" version of DTLS_BAD_VER.
SSL_OP_COOKIE_EXCHANGE | Instructs OpenSSL to turn on cookie exchange.
SSL_OP_CRYPTOPRO_TLSEXT_BUG | Instructs OpenSSL to add server-hello extension from an early version of the cryptopro draft.
SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS | Instructs OpenSSL to disable a SSL 3.0/TLS 1.0 vulnerability workaround added in OpenSSL 0.9.6d.
SSL_OP_EPHEMERAL_RSA | Instructs OpenSSL to always use the tmp_rsa key when performing RSA operations.
SSL_OP_LEGACY_SERVER_CONNECT | Allows initial connection to servers that do not support RI.
SSL_OP_MICROSOFT_BIG_SSLV3_BUFFER | 
SSL_OP_MICROSOFT_SESS_ID_BUG | 
SSL_OP_MSIE_SSLV2_RSA_PADDING | Instructs OpenSSL to disable the workaround for a man-in-the-middle protocol-version vulnerability in the SSL 2.0 server implementation.
SSL_OP_NETSCAPE_CA_DN_BUG | 
SSL_OP_NETSCAPE_CHALLENGE_BUG |
SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG |
SSL_OP_NETSCAPE_REUSE_CIPHER_CHANGE_BUG |
SSL_OP_NO_COMPRESSION | Instructs OpenSSL to disable support for SSL/TLS compression.
SSL_OP_NO_QUERY_MTU | 
SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION | Instructs OpenSSL to always start a new session when performing renegotiation.
SSL_OP_NO_SSLv2 | Instructs OpenSSL to turn off SSL v2
SSL_OP_NO_SSLv3 | Instructs OpenSSL to turn off SSL v3
SSL_OP_NO_TICKET | Instructs OpenSSL to disable use of RFC4507bis tickets.
SSL_OP_NO_TLSv1 | Instructs OpenSSL to turn off TLS v1
SSL_OP_NO_TLSv1_1 | Instructs OpenSSL to turn off TLS v1.1
SSL_OP_NO_TLSv1_2 | Instructs OpenSSL to turn off TLS v1.2
SSL_OP_PKCS1_CHECK_1 | 
SSL_OP_PKCS1_CHECK_2 | 
SSL_OP_SINGLE_DH_USE | Instructs OpenSSL to always create a new key when using temporary/ephemeral DH parameters.
SSL_OP_SINGLE_ECDH_USE | Instructs OpenSSL to always create a new key when using temporary/ephemeral ECDH parameters.
SSL_OP_SSLEAY_080_CLIENT_DH_BUG | 
SSL_OP_SSLREF2_REUSE_CERT_TYPE_BUG | 
SSL_OP_TLS_BLOCK_PADDING_BUG | 
SSL_OP_TLS_D5_BUG | 
SSL_OP_TLS_ROLLBACK_BUG | Instructs OpenSSL to disable version rollback attack detection.

### OpenSSL 引擎的常量

Constant | Description
- | -
ENGINE_METHOD_RSA | Limit engine usage to RSA
ENGINE_METHOD_DSA | Limit engine usage to DSA
ENGINE_METHOD_DH | Limit engine usage to DH
ENGINE_METHOD_RAND | Limit engine usage to RAND
ENGINE_METHOD_EC | Limit engine usage to EC
ENGINE_METHOD_CIPHERS | Limit engine usage to CIPHERS
ENGINE_METHOD_DIGESTS | Limit engine usage to DIGESTS
ENGINE_METHOD_PKEY_METHS | Limit engine usage to PKEY_METHDS
ENGINE_METHOD_PKEY_ASN1_METHS | Limit engine usage to PKEY_ASN1_METHS
ENGINE_METHOD_ALL | 
ENGINE_METHOD_NONE | 

### 其他 OpenSSL 常量

Constant | Description
- | -
DH_CHECK_P_NOT_SAFE_PRIME | 
DH_CHECK_P_NOT_PRIME | 
DH_UNABLE_TO_CHECK_GENERATOR | 
DH_NOT_SUITABLE_GENERATOR | 
ALPN_ENABLED | 
RSA_PKCS1_PADDING | 
RSA_SSLV23_PADDING | 
RSA_NO_PADDING | 
RSA_PKCS1_OAEP_PADDING | 
RSA_X931_PADDING | 
RSA_PKCS1_PSS_PADDING | 
RSA_PSS_SALTLEN_DIGEST | Sets the salt length for RSA_PKCS1_PSS_PADDING to the digest size when signing or verifying.
RSA_PSS_SALTLEN_MAX_SIGN | Sets the salt length for RSA_PKCS1_PSS_PADDING to the maximum permissible value when signing data.
RSA_PSS_SALTLEN_AUTO | Causes the salt length for RSA_PKCS1_PSS_PADDING to be determined automatically when verifying a signature.
POINT_CONVERSION_COMPRESSED | 
POINT_CONVERSION_UNCOMPRESSED | 
POINT_CONVERSION_HYBRID | 

### crypto 常量

Constant | Description
- | -
defaultCoreCipherList | Specifies the built-in default cipher list used by Node.js.
defaultCipherList | Specifies the active default cipher list used by the current Node.js process.
