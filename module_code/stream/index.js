/*
 * @Author: yanglinylin.yang 
 * @Date: 2019-12-02 20:05:17 
 * @Last Modified by: yanglinylin.yang
 * @Last Modified time: 2019-12-05 17:33:29
 */

// http服务器
const http = require('http');
const server = http.createServer((req, res) => {
    // req是一个http.IncomingMessage实例，它是可读流
    // res是一个http.ServerResponse实例，它是可写流
    let body = '';
    // 接收数据为utf8字符串
    // 如果没有设置字符编码，则会接收到Buffer对象
    req.setEncoding('utf8');
    // 如果添加了监听器，则可读流会触发'data'事件
    req.on('data', (chunk) => {
        body += chunk;
    });
    // 'end'事件表明整个请求体已被接收
    req.on('end', () => {
        try {
            const data = JSON.parse(body);
            // 响应信息给用户
            res.write(typeof data);
            res.end();
        } catch (err) {
            // json解析失败
            res.statusCode = 400;
            return res.end(`错误: ${err.message}`);
        }
    });
});
server.listen(1337);
// $ curl localhost:1337 -d "{}"
// object
// $ curl localhost:1337 -d "\"foo\""
// string
// $ curl localhost:1337 -d "not json"
// 错误: Unexpected token o in JSON at position 1


// 可读流的例子
// 依次触发读取1到1,000,000
const {Readable} = require('stream');
class Counter extends Readable {
    constructor(opt) {
        super(opt);
        this._max = 1000000;
        this._index = 1;
    }
    _read() {
        const i = this._index++;
        if (i > this._max) {
            this.push(null);
        } else {
            const str = String(i);
            const buf = Buffer.from(str, 'ascii');
            this.push(buf);
        }
    }
}


// 双工流的例子
// 封装了一个可以写入数据的假设的底层源对象，并且可以从中读取数据，尽管使用的是与Node.js流不兼容的API。
// 下面举例了一个双工流的简单示例，它通过可读流接口读回可写流接口的buffer传入的写入数据。
const {Duplex} = require('stream');
const kSource = Symbol('source');
class MyDuplex extends Duplex {
    constructor(source, options) {
        super(options);
        this[kSource] = source;
    }
    _write(chunk, encoding, callback) {
        // 底层资源只处理字符串
        if (Buffer.isBuffer(chunk)) {
            chunk = chunk.toString();
        }
        this[kSource].writeSomeDate(chunk);
        callback();
    }
    _read(size) {
        this[kSource].fetchSomeDate(size, (data, encoding) => {
            this.push(Buffer.from(data, encoding));
        });
    }
}


// 对象模式的双工流
// 可以使用readableObjectMode和writeableObjectMode选项来分别设置可读端和可写端的objectMode
// 下面的例子，创建了一个变换流(双工流的一种)，对象模式的可写端接收JavaScript数值，并在可读端转换为十六进制字符串。
const {Transform} = require('stream');
// 转换流也是双工流
const myTransform = new Transform({
    writeableObjectMode: true,
    transform(chunk, encoding, callback) {
        // 强制把chunk转换成数值
        chunk |= 0;
        // 将chunk转换成十六进制
        const data = chunk.toString(16);
        // 推送数据到可读队列
        callback(null, '0'.repeat(data.length % 2) + data);
    }
});
myTransform.setEncoding('ascii');
myTransform.on('data', (chunk) => console.log(chunk));
myTransform.write(1);       // 打印：01
myTransform.write(10);      // 打印：0a
myTransform.write(100);     // 打印：64




