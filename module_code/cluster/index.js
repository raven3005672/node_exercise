/*
 * @Author: yanglinylin.yang 
 * @Date: 2019-11-20 20:18:03 
 * @Last Modified by: yanglinylin.yang
 * @Last Modified time: 2019-11-21 16:12:34
 */

const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    console.log(`主进程${process.pid}正在运行`);
    // 衍生工作进程
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    cluster.on('exit', (worker, code, signal) => {
        console.log(`工作进程${worker.process.pid}已退出`)
    });
} else {
    // 工作进程可以共享任何TCP连接
    // 在本例中，共享的是HTTP服务器
    http.createServer((req, res) => {
        res.writeHead(200);
        res.end('hello world');
    }).listen(8000);

    console.log(`工作进程${process.pid}已启动`)
}

// node index.js
// 主进程xxxx正在运行
// 工作进程aaaa已启动
// 工作进程bbbb已启动
// 工作进程cccc已启动
// 工作进程dddd已启动