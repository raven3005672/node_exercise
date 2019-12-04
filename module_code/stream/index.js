/*
 * @Author: yanglinylin.yang 
 * @Date: 2019-12-02 20:05:17 
 * @Last Modified by: yanglinylin.yang
 * @Last Modified time: 2019-12-04 20:00:47
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

