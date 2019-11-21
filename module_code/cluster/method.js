/*
 * @Author: yanglinylin.yang 
 * @Date: 2019-11-21 16:12:17 
 * @Last Modified by: yanglinylin.yang
 * @Last Modified time: 2019-11-21 17:39:50
 */

// worker.disconnect()
if (cluster.isMaster) {
    const worker = cluster.fork();
    let timeout;
    worker.on('listening', (address) => {
        worker.send('shutdown');
        worker.disconnect();
        timeout = setTimeout(() => {
            worker.kill();
        }, 2000);
    });
    worker.on('disconnect', () => {
        clearTimeout(timeout);
    });
} else if (cluster.isWorker) {
    const net = require('net');
    const server = net.createServer((socket) => {
        // 连接永远不会结束
    });
    server.listen(8000);
    process.on('message', (msg) => {
        if (msg === 'shutdown') {
            // 将所有与服务器的连接优雅地关闭
        }
    });
}

// worker.exitedAfterDisconnect
cluster.on('exit', (worker, code, signal) => {
    if (worker.exitedAfterDisconnect === true) {
      console.log('这是自发退出，无需担心');
    }
});
// 杀死工作进程。
worker.kill();

// worker.id
// 每一个新衍生的工作进程都会被赋予自己独一无二的编号，这个编号就是存储在id里面。
// 当工作进程还存活时，这个编号可以作为在cluster.workers中的索引

// worker.isConnected()
// 工作进程通过IPC管道连接至主进程时，这个方法返回true，否则返回false。

// worker.isDead()
// 工作进程被终止时返回true，否则返回false。
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;
if (cluster.isMaster) {
    console.log(`主进程${process.pid}正在运行`);
    // 衍生工作进程
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    cluster.on('fork', (worker) => {
        console.log('工作进程已关闭:', wroker.isDead());
    });
    cluster.on('exit', (worker, code, signal) => {
        console.log('工作进程已关闭:', worker.isDead());
    });
} else {
    // 工作进程可以共享任何TCP连接。在这种情况下，它是一个HTTP服务器
    http.createServer((req, res) => {
        res.writeHead(200);
        res.end(`当前进程 ${process.pid}`);
        process.kill(process.pid);
    }).listen(8000);
}

// worker.kill([signal='SIGTERM'])
// 杀死工作进程




