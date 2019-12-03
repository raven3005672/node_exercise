/*
 * @Author: yanglinylin.yang 
 * @Date: 2019-12-02 20:05:17 
 * @Last Modified by: yanglinylin.yang
 * @Last Modified time: 2019-12-03 20:30:27
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


// 可写流的drain事件
// 向可写流中写入数据一百万次，留意背压（back-pressure）
function writeOneMillionTimes(writer, data, encoding, callback) {
    let i = 1000000;
    write();
    function write() {
        let ok = true;
        do {
            i--;
            if (i === 0) {
                // 最后一次写入
                writer.write(data, encoding, callback);
            } else {
                // 检查是否可以继续写入
                // 不要传入回调，因为写入还没有结束
                ok = writer.write(data, encoding);
            }
        } while (i > 0 && ok);
        if (i > 0) {
            // 被提前中止
            // 当触发'drain'事件时继续写入
            writer.once('drain', write);
        }
    }
}


// finish事件
// 调用stream.end()且缓冲数据都已传给底层系统之后触发
const writer = getWritableStreamSomehow();
for (let i = 0; i < 100; i++) {
    writer.write(`写入 #${i}!\n`);
}
writer.end('写入结尾\n');
writer.on('finish', () => {
    console.error('写入已完成');
});


// pipe事件
// 当在可读流上调用stream.pipe()方法时会发出pipe事件，并将此可写流添加到其目标集。
const writer = getWritableStreamSomehow();
const reader = getReadableStreamSomehow();
writer.on('pipe', (src) => {
    console.log('有数据正通过管道流入写入器');
    assert.equal(src, reader);
});
reader.pipe(writer);








