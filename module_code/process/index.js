/*
 * @Author: yanglinylin.yang 
 * @Date: 2019-11-29 11:30:22 
 * @Last Modified by: yanglinylin.yang
 * @Last Modified time: 2019-11-29 20:11:01
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





