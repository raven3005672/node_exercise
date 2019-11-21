# Cluster集群

[本部分文档](http://nodejs.cn/api/cluster.html)

单个Node.js实例运行在单个线程中。为了充分利用多核系统，有时需要启用一组Node.js进程去处理负载任务。

cluster模块可以创建共享服务器端口的子进程。

工作进程可以共享任何TCP连接。

在Windows上，尚无法在工作进程中设置命名管道服务器。

## 工作原理

工作进程由child_process.fork()方法创建，因此它们可以使用IPC和父进程通信，从而使各进程交替处理连接服务。

cluster模块支持两种分发连接的方法：

* 第一种方法（也是除windows外所有平台的默认方法）是循环法，由主进程负责监听端口，接受新连接后再将连接循环分发给工作进程，在分发中使用了一些内置技巧防止工作进程过载。
* 第二种方法是，主进程创建监听socket后发送给感兴趣的工作进程，由工作进程负责直接接收连接。

理论上第二种方法应该是效率最佳的。但在实际情况下，由于操作系统调度机制的难以捉摸，会使分发变得不稳定。可能会出现八个进程中两个分担了70%的负载。

因为server.listen()将大部分工作交给主进程完成，因此导致普通Node.js进程与cluster工作进程差异的情况有三种：

1. server.listen({fd: 7})因为消息会被传给主进程，所以父进程中的文件描述符7将会被监听并将句柄传给工作进程，而不是监听文件描述符7指向的工作进程。
2. server.listen(handle)显式地监听句柄，会导致工作进程直接使用该句柄，而不是和主进程通信。
3. server.listen(0)正常情况下，这种调用会导致server在随机端口上监听。但在cluster模式中，所有工作进程每次调用listen(0)时会收到相同的“随机”端口。实质上，这种端口只在第一次分配时随机，之后就变得可预料。如果要使用独立端口的话，应该根据工作进程的ID来生成端口号。

Node.js不支持路由逻辑。因此在设计应用时，不应该过分依赖内存数据对象，例如session和登录等。

由于各工作进程是独立的进程，它们可以根据需要随时关闭或重新生成，而不影响其他进程的正常运行。只要有存活的工作进程，服务器就可以继续处理连接。如果没有存活的工作进程，现有连接会丢失，新的连接也会被拒绝。Node.js不会自动管理工作进程的数量，而应该由具体的应用根据实际需要来管理进程池。

虽然cluster模块主要用于网络相关的情况，但同样可以用于其他需要工作进程的情况。

## Worker类

继承自：<EventEmitter>

Worker对象包含了关于工作进程的所有的公共的信息和方法。在主进程中，可以使用cluster.workers来获取它。在工作进程中，可以使用cluster.worker来获取它。

### disconnect事件

类似于cluster.on('disconnect')事件，但特定于此工作进程。

```js
cluster.fork().on('disconnect', () => {
    // 工作进程已断开连接
});
```

### error事件

此事件和child_process.fork()提供的事件相同。
在一个工作进程中，也可以使用process.on('error')

### exit事件

code: <number>正常退出时的退出代码
signal: <string>导致进程被杀死的信号名称(例如'SIGHUP')。
类似于cluster.on('exit')事件，但特定于此工作进程。

```js
const worker = cluster.fork();
worker.on('exit', (code, signal) => {
    if (signal) {
        console.log(`工作进程已被信号${signal}杀死`);
    } else if (code !== 0) {
        console.log(`工作进程退出，退出码：${code}`);
    } else {
        console.log('工作进程成功退出');
    }
});
```

### listening事件

address: <Object>
类似于cluster.on('listening')事件，但特定于此工作进程。

```js
cluster.fork().on('listening', (address) => {
    // 工作进程正在监听
});
```

此事件不会在工作进程中触发。

### message事件

message: <Object>
handle: <undefined> | <Object>
类似于cluster.on('message')事件，但特定于此工作进程。
在工作进程内，也可以使用process.on('message')

```js
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
```

### online事件

类似于cluster.on('online')事件，但特定于此工作进程。

```js
cluster.fork().on('online', () => {
    // 工作进程已上线
});
```

### worker.disconnect()

* Returns: <cluster.Worker> worker的引用

在一个工作进程内，调用此方法会关闭所有的server，并等待这些server的'close'事件执行，然后关闭IPC管道。
在主进程内，会给工作进程发送一个内部消息，导致工作进程自身调用.disconnect()。
会设置.exitedAfterDisconnect。
当一个server关闭后，它将不再接收新的连接，但新连接会被其他正在监听的工作进程接收。已建立的连接可以正常关闭。当所有连接都关闭后，通往该工作进程的IPC管道将会关闭，允许工作进程优雅地撕掉，详见server.close()。
以上情况只针对服务端连接，工作进程不会自动关闭客户端链接，disconnect方法在退出前不会等待客户端连接关闭。
在工作进程中，也存在process.disconnect，但他不是这个函数，他是disconnect()。
因为长时间运行的服务端连接可能组织工作进程断开连接，可以采用发送消息的方法，让应用采取相应的动作来关闭连接。也可以通过设置超时，当'disconnect'事件在某段事件后仍没有触发时关闭工作进程。

```js
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
```

### worker.exitedAfterDisconnect

* <boolean>

如果工作进程由于.kill()或.disconnect()而退出，则此属性为true。如果工作进程以任何其他方式退出，则为false。如果工作进程尚未退出，则为undefined。

worker.exitedAfterDisconnect可以用于区分自发退出还是被动退出，主进程可以根据这个值决定是否重新衍生工作进程。

```js
cluster.on('exit', (worker, code, signal) => {
    if (worker.exitedAfterDisconnect === true) {
        console.log('自发退出，无需担心');
    }
})
// 杀死工作进程
```

### worker.id

* <number>

每一个新衍生的工作进程都会被赋予自己独一无二的编号，这个编号就是存储在id里面。
当工作进程还存活时，这个编号可以作为在cluster.workers中的索引。

### worker.isConnected()

当工作进程通过IPC管道连接至主进程时，这个方法返回true，否则返回false。一个工作进程在创建后会自动连接到它的主进程。当'disconnect'事件被触发时才会断开连接。

### worker.isDead()

当工作进程被终止时（包括自动退出或被发送信号），这个方法返回true。否则返回false。

```js
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
```

### worker.kill([signal='SIGTERM'])

* signal <string> 发送给工作进程的杀死信号的名称

这个方法将会杀死工作进程。在主进程中，通过断开与worker.process的连接来实现，一旦断开连接后，通过signal来杀死工作进程。在工作进程中，通过断开IPC管道来实现，然后以代码0退出进程。

因为kill()会尝试正常地断开工作进程，所以很容易无限期地等待断开连接完成。例如，如果工作进程进入无限循环，则永远不会发生正常断开连接。如果不需要正常的断开连接行为，请使用worker.process.kill()。

将导致.exitedAfterDisconnect被设置。

为向后兼容，这个方法与worker.destroy()等义。

在工作进程中，也存在process.kill()，但它不是这个函数，它是kill()。

### worker.process

* ChildProcess

所有的工作进程都是通过child_process.fork()来创建的，这个方法返回的对象被存储为.process。在工作进程中，process属于全局对象。

当process上发生'disconnect'时间，并且.exitedAfterDisconnect的值不是true时，工作进程会调用process.exit(0)。这样就可以防止链接意外断开。

### worker.send(message[, sendHandle[, options]][, callback])

* message <Object>
* sendHandle <Handle>
* options <Object> options参数（如果存在）是一个对象，用于参数化某些类型的句柄的发送。options支持以下属性：
    * keepOpen <boolean> 当传递net.Socket实例时可以使用的值。当为true时，套接字在发送的过程中保持打开状态。默认值：false
* callback <Function>
* return: <boolean>

发送一个消息给工作进程或主进程，也可以附带发送一个句柄。
在主进程中，这会发送消息给特定的工作进程。相当于ChildProcess.send()。
在工作进程中，这会发送消息给主进程。相当于process.send()。
在这个例子里面，工作进程将主进程发送的消息响应回去：

```js
if (cluster.isMaster) {
    const worker = cluster.fork();
    worker.send('你好');
} else if (cluster.isWorker) {
    process.on('message', (msg) => {
        process.seng(msg);
    });
}
```

## disconnect事件

* worker <cluster.Worker>

在工作进程的IPC管道被断开后触发。可能导致事件触发的原因包括：工作进程优雅地退出、被杀死、或手动断开连接（如调用worker.disconnect()）

disconnect和exit事件之间可能存在延迟。这些时间可以用来检测是否在清理过程中被卡住，或是否存在长时间运行的连接。

```js
cluster.on('disconnect', (worker) => {
    console.log(`工作进程 #${worker.id} 已断开连接`);
});
```

## exit事件

* worker <cluster.Worker>
* code <number> 正常退出时的退出代码
* signal <string> 导致进程被杀死的信号名称

当任何一个工作进程关闭的时候，cluster模块都将会触发exit事件。
这可以用于重启工作进程（通过再次调用.fork()）

```js
cluster.on('exit', (worker, code, signal) => {
    console.log('工作进程 %d 关闭 (%s). 重启中...', worker.process.pid, signal || code);
    cluster.fork();
});
```

## fork事件

* worker <cluster.Worker>

当新的工作进程被衍生时，cluster模块将会触发fork事件。可以被用来记录工作进程活动，并产生一个自定义的超时。

```js
const timeouts = [];
function errorMsg() {
    console.log('连接出错');
}
cluster.on('fork', (worker) => {
    timeouts[worker.id] = setTimeout(errorMsg, 2000);
});
cluster.on('listening', (worker) => {
    clearTimeout(timeouts[worker.id]);
});
cluster.on('exit', (worker, code, signal) => {
    clearTimeout(timeouts[worker.id]);
    errorMsg();
});
```

## listening事件

* worker <cluster.Worker>
* address <Object>

当一个工作进程调用listen()后，工作进程上的server会触发listening事件，同时主进程上的cluster也会触发listening事件。
事件句柄使用两个参数来执行，其中worker包含了工作进程对象，address包含了以下的连接属性：address、port和addressType。当工作进程同时监听多个地址时，这些参数非常有用

```js
cluster.on('listening', (worker, address) => {
    console.log(`工作进程已连接到${address.address}:${address.port}`);
});
// addressType可选值包括：
// 4 => TCPv4
// 6 => TCPv6
// -1 => Unix域socket
// udp4 or upd6 => UDPv4或v6
```

## message事件

* worker <cluster.Worker>
* message <Object>
* handle <undefined> | <Object>

当集群主进程从任何工作进程接收到消息时触发

## online事件

* worker <cluster.Worker>

当衍生一个新的工作进程后，工作进程应当响应一个上线消息。当主进程收到上线消息后将会触发此事件。fork事件和online事件的区别在于，当主进程衍生工作进程时触发fork，当工作进程运行时触发online。

```js
cluster.on('online', (worker) => {
    console.log('工作进程被衍生后响应');
});
```

## setup事件

* settings <Object>

每当.setupMaster()被调用时触发。
settings对象是.setupMaster()被调用时的cluster.settings对象，并且只能查询，因为在一个时间点内.setupMaster()可以被调用多次。
如果精确度十分重要，则使用cluster.settings。

## cluster.disconnect([callback])

* callback <Function> 当所有工作进程都断开连接并且所有句柄都关闭的时候调用。

在cluster.workers的每个工作进程中调用.disconnect()。
当所有工作进程断开连接后，所有内部句柄将会关闭，这个时候如果没有等待事件的话，运行主进程优雅地关闭。
这个方法可以选择添加一个回调参数，当结束时会调用这个回调函数。
这个方法只能由主进程调用。

## cluster.fork([env])

* env <Object> 要添加到进程环境变量的键值对。
* return: <cluster.Worker>

衍生出一个新的工作进程。
这只能通过主进程调用。

## cluster.isMaster

* <boolean>

如果该进程是主进程，则为true。这是由process.env.NODE_UNIQUE_ID决定的。如果process.env.NODE_UNIQUE_ID未定义，则isMaster为true。

## cluster.isWorker

* <boolean>

如果该进程不是主进程，则为true（与cluster.isMaster相反）

## cluster.schedulingPolicy

调度策略，包括循环计数的cluster.SCHED_RR，以及由操作系统决定的cluster.SCHED_NONE。这是一个全局设置，当第一个工作进程被衍生或者调用.setupMaster()时，都将第一时间生效。
除windows外的所有操作系统中，SCHED_RR都是默认设置。只要libuv可以有效地分发IOCP句柄，而不会导致严重的性能冲击的话，Windows系统也会更改为SCHED_RR。
cluster.schedulingPolicy可以通过设置NODE_CLUSTER_SCHED_POLICY环境变量来实现。这个环境变量的有效值包括rr和none

## cluster.settings

* <Object>
    * execArgv <string[]> 传给Node.js可执行文件的字符串参数列表。默认值：process.execArgv
    * exec <string> 工作进程的文件路径。默认值: process.argv[1]。
    * args <string[]> 传给工作进程的字符串参数。默认值: process.argv.slice(2)。
    * cwd <string> 工作进程的当前工作目录。默认值: undefined（从父进程继承）。
    * silent <boolean> 是否需要发送输出到父进程的 stdio。默认值: false。
    * stdio <Array> 配置衍生的进程的 stdio。 由于 cluster 模块运行依赖于 IPC，这个配置必须包含 'ipc'。如果提供了这个选项，则覆盖 silent。
    * uid <number> 设置进程的用户标识符。参阅 setuid(2)。
    * gid <number> 设置进程的群组标识符。参阅 setgid(2)。
    * inspectPort <number> | <Function> 设置工作进程的检查端口。这可以是一个数字、或不带参数并返回数字的函数。默认情况下，每个工作进程都有自己的端口，从主进程的 process.debugPort 开始递增。
    * windowsHide <boolean> 隐藏衍生的进程的控制台窗口（通常在 Windows 系统上会创建）。默认值: false。

调用 .setupMaster()（或 .fork()）之后，这个配置对象将会包含这些配置项，包括默认值。
这个对象不打算被修改或手动设置。

## cluster.setupMaster([settings])

* settings <Object> 详见cluster.settings.

setupMaster用于修改默认的fork行为。一旦调用，将会按照cluster.settings进行设置。
所有的设置只对后来的.fork()调用有效，对之前的工作进程无影响。
唯一无法通过.setupMaster()设置的属性是传给.fork()的env属性。
上述的默认值只在第一次调用时有效，当后续调用时，将采用cluster.setupMaster()调用时的当前值。

```js
const cluster = require('cluster');
cluster.setupMaster({
    exec: 'worker.js',
    args: ['--use', 'https'],
    silent: true
});
cluster.fork();     // https工作进程
cluster.setupMaster({
    exec: 'worker.js',
    args: ['--use', 'http']
});
cluster.fork();     // http工作进程
```

这只能由主进程调用。

## cluster.worker

* <Object>

当前工作进程对象的引用。对于主进程则无效。

```js
const cluster = require('cluster');
if (cluster.isMaster) {
    console.log('这是主进程');
    cluster.fork();
    cluster.fork();
} else if (cluster.isWorker) {
    console.log(`这是工作进程 #${cluster.worker.id}`);
}
```

## cluster.workers

* <Object>

这是一个哈希表，储存了活跃的工作进程对象，使用id作为键名。这使得可以方便地遍历所有工作进程。只能在主进程中调用。
工作进程断开连接以及退出后，将会从cluster.workers里面移除。这两个事件的先后顺序并不能预先确定。但可以保证的是，cluster.workers的移除工作在 disconnect和exit两个事件中的最后一个触发之前完成。

```js
// 遍历所有工作进程。
function eachWorker(callback) {
    for (const id in cluster.workers) {
        callback(cluster.workers[id]);
    }
}
eachWorker((worker) => {
    worker.send('通知所有工作进程');
});
```

使用工作进程的唯一id是定位工作进程最简单的方式。

```js
socket.on('data', (id) => {
    const worker = cluster.workers[id];
});
```




