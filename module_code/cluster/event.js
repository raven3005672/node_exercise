/*
 * @Author: yanglinylin.yang 
 * @Date: 2019-11-21 15:45:28 
 * @Last Modified by: yanglinylin.yang
 * @Last Modified time: 2019-11-21 16:12:29
 */

// disconnect
cluster.fork().on('disconnect', () => {
    // 工作进程已断开连接
});

// error
process.on('error');

// exit
const worker = cluster.fork();
worker.on('exit', (code, signal) => {
    console.log('exit', code, signal)
});

// listening
// 不会在工作进程中触发
cluster.fork().on('listening', (address) => {
    // 工作进程正在监听
});

// message
// 消息系统的示例，在主进程中对工作进程接收的HTTP请求数量保持计数：
const cluster = require('cluster');
const http = require('http');
if (cluster.isMaster) {
    // 跟踪http请求
    let numReqs = 0;
    setInterval(() => {
        console.log(`请求的数量 = ${numReqs}`);
    }, 1000);

    // 对请求计数
    function messageHandler(msg) {
        if (msg.cmd && msg.cmd === 'notifyRequest') {
            numReqs += 1;
        }
    }

    // 启动worker并监听包含notifyRequest的消息
    const numCPUs = require('os').cpus().length;
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }
    for (const id in cluster.workers) {
        cluster.workers[id].on('message', messageHandler);
    }
} else {
    // 工作进程有一个http服务器
    http.Server((req, res) => {
        res.writeHead(200);
        res.end('hello world');
        // 通知主进程接收到了请求
        process.send({cmd: 'notifyRequest'});
    }).listen(8000);
}

// online
cluster.fork().on('online', () => {
    // 工作进程已上线
});
