/*
 * @Author: yanglinylin.yang 
 * @Date: 2019-11-22 15:36:07 
 * @Last Modified by: yanglinylin.yang
 * @Last Modified time: 2019-11-22 17:17:57
 */

// demo1
// 发送server对象
// sendHandle参数可用于将一个TCP server对象的句柄传给子进程，如一下示例所示：
const subprocess = require('child_process').fork('subprocess.js');

// 打开server对象，并发送该句柄
const server = require('net').createServer();
server.on('connection', (socket) => {
    socket.end('由父进程处理');
});
server.listen(1337, () => {
    subprocess.send('server', server);
});

// 子进程接收server对象如下：
process.on('message', (m, server) => {
    if (m === 'server') {
        server.on('connection', (socket) => {
            socket.end('由子进程处理');
        });
    } 
});




// demo2
// 发送socket对象
// sendHandle参数可用于将socket的句柄传给子进程。以下示例衍生了两个子进程，分别用于处理normal连接或有限处理special连接：
const {fork} = require('child_process');
const normal = fork('subprocess.js', ['normal']);
const special = fork('subprocess.js', ['special']);

// 开启server，并发送socket给子进程。
// 使用`pauseOnConnect`防止socket在被发送到子进程之前被读取。
const server = require('net').createServer({pauseOnConnect: true});
server.on('connection', (socket) => {
    // 特殊优先级
    if (socket.remoteAddress === '74.125.127.100') {
        special.send('socket', socket);
        return;
    }
    // 普通优先级
    nromal.send('socket', socket);
});
server.listen(1337);

// subprocess.js会接收该socket句柄作为传给事件回调函数的第二个参数
process.on('message', (m, socket) => {
    if (m === 'socket') {
        if (socket) {
            // 检查客户端socket是否存在
            // socket在被发送与被子进程接收这段时间内可被关闭
            socket.end(`请求使用 ${process.argv[2]} 优先级处理`);
        }
    }
});
