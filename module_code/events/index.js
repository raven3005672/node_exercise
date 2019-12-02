/*
 * @Author: yanglinylin.yang 
 * @Date: 2019-12-02 17:14:14 
 * @Last Modified by: yanglinylin.yang
 * @Last Modified time: 2019-12-02 20:03:53
 */

const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const myEmitter = new MyEmitter();
myEmitter.on('event', () => {
    console.log('触发事件');
});
myEmitter.emit('event');


// EventEmitter.emit()方法可以传任意数量的参数到监听器函数。当监听器函数被调用时，this关键词会被指向监听器所绑定的EventEmitter实例。
const myEmitter = new MyEmitter();
myEmitter.on('event', function(a, b) {
    console.log(a, b, this, this === myEmitter);
    // 打印:
    //   a b MyEmitter {
    //     domain: null,
    //     _events: { event: [Function] },
    //     _eventsCount: 1,
    //     _maxListeners: undefined } true
});
myEmitter.emit('event', 'a', 'b');
// 也可以使用ES6的箭头函数作为监听器，但是this关键词不会指向EventEmitter实例
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
    console.log(a, b, this);
    // 打印: a b {}
});
myEmitter.emit('event', 'a', 'b');


// eventEmitter.on()每次触发命名事件时被调用
const myEmitter = new MyEmitter();
let m = 0;
myEmitter.on('event', () => {
    console.log(++m);
});
myEmitter.emit('event');
// 打印: 1
myEmitter.emit('event');
// 打印: 2
// eventEmitter.once()注册最多可调用一次的监听器。当事件被触发时，监听器会被注销，然后再调用。
const myEmitter = new MyEmitter();
let m = 0;
myEmitter.once('event', () => {
    console.log(++m);
});
myEmitter.emit('event');
// 打印: 1
myEmitter.emit('event');
// 不触发


// 最佳实践，应该始终为error事件注册监听器
const myEmitter = new MyEmitter();
myEmitter.on('error', (err) => {
    console.error('错误信息');
});
myEmitter.emit('error', new Error('错误'));
// 打印: 错误信息



// removeListener() 最多只会从监听器数组中移除一个监听器。 如果监听器被多次添加到指定 eventName 的监听器数组中，则必须多次调用 removeListener() 才能移除所有实例。
// 一旦事件被触发，所有绑定到该事件的监听器都会按顺序依次调用。 这意味着，在事件触发之后、且最后一个监听器执行完成之前， removeListener() 或 removeAllListeners() 不会从 emit() 中移除它们。
const myEmitter = new MyEmitter();
const callbackA = () => {
    console.log('A');
    myEmitter.removeListener('event', callbackB);
};
const callbackB = () => {
    console.log('B');
};
myEmitter.on('event', callbackA);
myEmitter.on('event', callbackB);
// callbackA 移除了监听器 callbackB，但它依然会被调用。
// 触发时内部的监听器数组为 [callbackA, callbackB]
myEmitter.emit('event');
// 打印:
//   A
//   B
// callbackB 现已被移除。
// 内部的监听器数组为 [callbackA]
myEmitter.emit('event');
// 打印:
//   A

// 如果单个函数作为处理程序多次添加为单个事件（如下例所示），则 removeListener() 将删除最近添加的实例。 在示例中，删除了监听器 once('ping')：
const ee = new EventEmitter();
function pong() {
    console.log('pong');
}
ee.on('ping', pong);
ee.once('ping', pong);
ee.removeListener('ping', pong);
ee.emit('ping');
ee.emit('ping');
