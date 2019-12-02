/*
 * @Author: yanglinylin.yang 
 * @Date: 2019-11-29 11:30:22 
 * @Last Modified by: yanglinylin.yang
 * @Last Modified time: 2019-12-02 16:51:51
 */

process.on('beforeExit', (code) => {
    console.log('进程 beforeExit 事件的代码: ', code);
  });
process.on('exit', (code) => {
    console.log('进程 exit 事件的代码: ', code);
    setTimeout(() => {
        console.log('此处不会运行');
    }, 0);
});  
console.log('此消息最新显示');
// 打印:
// 此消息最新显示
// 进程 beforeExit 事件的代码: 0
// 进程 exit 事件的代码: 0


process.on('multipleResolves', (type, promise, reason) => {
    console.error(type, promise, reason);
    setImmediate(() => process.exit(1));
});
async function main() {
    try {
        return await new Promise((resolve, reject) => {
            resolve('第一次调用');
            resolve('吞没解决');
            reject(new Error('吞没解决'));
        });
    } catch {
        throw new Error('失败');
    }
}
main().then(console.log);
// resolve: Promise { '第一次调用' } '吞没解决'
// reject: Promise { '第一次调用' } Error: 吞没解决
//     at Promise (*)
//     at new Promise (<anonymous>)
//     at main (*)
// 第一次调用


// 异步代码中，当未处理的拒绝列表增长时会触发unhandledRejection
// 当未处理的拒绝列表缩小时会触发rejectionHandled事件
const unhandledRejections = new Map();
process.on('unhandledRejection', (reason, promise) => {
    unhandledRejections.set(promise, reason);
});
process.on('rejectionHandled', (promise) => {
    unhandledRejections.delete(promise);
});

process.on('unhandledRejection', (reason, promise) => {
    console.log('未处理的拒绝：', promise, '原因：', reason);
    // 记录日志、抛出错误、或其他逻辑。
});
somePromise.then((res) => {
    return reportToUser(JSON.pasre(res)); // 故意输错 (`pasre`)。
}); // 没有 `.catch()` 或 `.then()`。
// 如下代码也会触发unhandledRejection事件
function SomeResource() {
    // 将 loaded 的状态设置为一个拒绝的 promise。
    this.loaded = Promise.reject(new Error('错误信息'));
}  
const resource = new SomeResource();
// resource.loaded 上没有 .catch 或 .then。


process.on('uncaughtException', (err, origin) => {
    fs.writeSync(
        process.stderr.fd,
        `捕获的异常: ${err}\n` +
        `异常的来源: ${origin}`
    );
});
setTimeout(() => {
    console.log('这里仍然会运行');
}, 500);  
// 故意引起异常，但不要捕获它。
nonexistentFunc();
console.log('这里不会运行');


process.on('warning', (warning) => {
    console.warn(warning.name);    // 打印告警名称
    console.warn(warning.message); // 打印告警信息
    console.warn(warning.stack);   // 打印堆栈信息
});


// 使用代码和其他详细信息触发警告。
process.emitWarning('出错啦', {
    code: 'MY_WARNING',
    detail: '一些额外的信息'
});
// 触发:
// (node:56338) [MY_WARNING] Warning: 出错啦
// 一些额外的信息
process.on('warning', (warning) => {
    console.warn(warning.name);    // 'Warning'
    console.warn(warning.message); // '出错啦'
    console.warn(warning.code);    // 'MY_WARNING'
    console.warn(warning.stack);   // Stack trace
    console.warn(warning.detail);  // '一些额外的信息'
});
// 如果 warning 是一个 Error 对象，则 options 参数会被忽略。
// 使用错误对象触发警告。
const myWarning = new Error('出错啦');
// 使用错误名称属性指定类型名称。
myWarning.name = 'CustomWarning';
myWarning.code = 'WARN001';
process.emitWarning(myWarning);
// 触发: (node:56338) [WARN001] CustomWarning: 出错啦


// 避免重复警告
function emitMyWarning() {
    if (!emitMyWarning.warned) {
        emitMyWarning.warned = true;
        process.emitWarning('只警告一次');
    }
}
emitMyWarning();
// 触发: (node: 56339) Warning: 只警告一次
emitMyWarning();
// 什么都没触发。


// process.exit会强制进程退出；可以设置process.exitCode并允许进程自然退出
// 这是一个错误用法的示例：
if (someConditionNotMet()) {
    printUsageToStdout();
    process.exit(1);
}
// 如何正确设置退出码，同时让进程正常退出。
if (someConditionNotMet()) {
    printUsageToStdout();
    process.exitCode = 1;
}


// process.kill(pid[, signal])
process.on('SIGHUP', () => {
    console.log('收到 SIGHUP 信号');
});  
setTimeout(() => {
    console.log('退出中');
    process.exit(0);
}, 100);  
process.kill(process.pid, 'SIGHUP');


// process.nextTick() 方法将 callback 添加到下一个时间点的队列。 在 JavaScript 堆栈上的当前操作运行完成之后以及允许事件循环继续之前，此队列会被完全耗尽。 如果要递归地调用 process.nextTick()，则可以创建无限的循环。 有关更多背景信息，请参阅事件循环指南。
console.log('开始');
process.nextTick(() => {
    console.log('下一个时间点的回调');
});
console.log('调度');
// 输出:
// 开始
// 调度
// 下一个时间点的回调
// 这在开发 API 时非常重要，以便在构造对象之后但在发生任何 I/O 之前，为用户提供分配事件处理函数的机会：
function MyThing(options) {
    this.setupOptions(options);
  
    process.nextTick(() => {
        this.startDoingStuff();
    });
}
const thing = new MyThing();
thing.getReadyForStuff();  
// thing.startDoingStuff() 现在被调用，而不是在之前。

// 如下写法更稳妥
function definitelyAsync(arg, cb) {
    if (arg) {
        process.nextTick(cb);
        return;
    }
    fs.stat('file', cb);
}











