# evnets(事件触发器)

[本部分文档](http://nodejs.cn/api/events.html)

大多数 Node.js 核心 API 构建于惯用的异步事件驱动架构，其中某些类型的对象（又称触发器，Emitter）会触发命名事件来调用函数（又称监听器，Listener）。

例如，net.Server 会在每次有新连接时触发事件，fs.ReadStream 会在打开文件时触发事件，stream会在数据可读时触发事件。

所有能触发事件的对象都是 EventEmitter 类的实例。 这些对象有一个 eventEmitter.on() 函数，用于将一个或多个函数绑定到命名事件上。 事件的命名通常是驼峰式的字符串，但也可以使用任何有效的 JavaScript 属性键。。

当 EventEmitter 对象触发一个事件时，所有绑定在该事件上的函数都会被同步地调用。 被调用的监听器返回的任何值都将会被忽略并丢弃。

例子，一个简单的 EventEmitter 实例，绑定了一个监听器。 eventEmitter.on() 用于注册监听器， eventEmitter.emit() 用于触发事件。

```js
const EventEmitter = require('events');

class MyEmitter extends EventEmitter {}

const myEmitter = new MyEmitter();
myEmitter.on('event', () => {
  console.log('触发事件');
});
myEmitter.emit('event');
```

## 将参数和 this 传给监听器

eventEmitter.emit() 方法可以传任意数量的参数到监听器函数。 当监听器函数被调用时， this 关键词会被指向监听器所绑定的 EventEmitter 实例。

```js
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
```

也可以使用 ES6 的箭头函数作为监听器。但 this 关键词不会指向 EventEmitter 实例：

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
  console.log(a, b, this);
  // 打印: a b {}
});
myEmitter.emit('event', 'a', 'b');
```

## 异步 VS 同步

EventEmitter 以注册的顺序同步地调用所有监听器。 这样可以确保事件的正确排序，并有助于避免竞态条件和逻辑错误。 当适当时，监听器函数可以使用 setImmediate() 和 process.nextTick() 方法切换到异步的操作模式：

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', (a, b) => {
  setImmediate(() => {
    console.log('异步地发生');
  });
});
myEmitter.emit('event', 'a', 'b');
```

## 仅处理事件一次

当使用 eventEmitter.on() 注册监听器时，监听器会在每次触发命名事件时被调用。

```js
const myEmitter = new MyEmitter();
let m = 0;
myEmitter.on('event', () => {
  console.log(++m);
});
myEmitter.emit('event');
// 打印: 1
myEmitter.emit('event');
// 打印: 2
```

使用 eventEmitter.once() 可以注册最多可调用一次的监听器。 当事件被触发时，监听器会被注销，然后再调用。

```js
const myEmitter = new MyEmitter();
let m = 0;
myEmitter.once('event', () => {
  console.log(++m);
});
myEmitter.emit('event');
// 打印: 1
myEmitter.emit('event');
// 不触发
```

## 错误事件

当 EventEmitter 实例出错时，应该触发 'error' 事件。 这些在 Node.js 中被视为特殊情况。

如果没有为 'error' 事件注册监听器，则当 'error' 事件触发时，会抛出错误、打印堆栈跟踪、并退出 Node.js 进程。

```js
const myEmitter = new MyEmitter();
myEmitter.emit('error', new Error('错误信息'));
// 抛出错误并使 Node.js 崩溃。
```

为了防止崩溃 Node.js 进程，可以使用 domain 模块。 （但请注意，不推荐使用 domain 模块。）

作为最佳实践，应该始终为 'error' 事件注册监听器。

```js
const myEmitter = new MyEmitter();
myEmitter.on('error', (err) => {
  console.error('错误信息');
});
myEmitter.emit('error', new Error('错误'));
// 打印: 错误信息
```

## EventEmitter 类

EventEmitter 类由 events 模块定义：

```js
const EventEmitter = require('events');
```

当新增监听器时，会触发 'newListener' 事件；当移除已存在的监听器时，则触发 'removeListener' 事件。

### 'newListener' 事件

* eventName <string> | <symbol> 事件的名称。
* listener <Function> 事件的句柄函数。

EventEmitter 实例在新的监听器被添加到其内部监听器数组之前，会触发自身的 'newListener' 事件。

为 'newListener' 事件注册的监听器将传递事件名称和对要添加的监听器的引用。

在添加监听器之前触发事件的事实具有微妙但重要的副作用：在 'newListener' 回调中注册到相同 name 的任何其他监听器将插入到正在添加的监听器之前。

```js
const myEmitter = new MyEmitter();
// 只处理一次，避免无限循环。
myEmitter.once('newListener', (event, listener) => {
  if (event === 'event') {
    // 在前面插入一个新的监听器。
    myEmitter.on('event', () => {
      console.log('B');
    });
  }
});
myEmitter.on('event', () => {
  console.log('A');
});
myEmitter.emit('event');
// 打印:
//   B
//   A
```

### 'removeListener' 事件

* eventName <string> | <symbol> 事件的名称。
* listener <Function> 事件的句柄函数。

'removeListener' 事件在 listener 被移除后触发。

### EventEmitter.listenerCount(emitter, eventName)

稳定性: 0 - 废弃: 改为使用 emitter.listenerCount() 。

* emitter <EventEmitter> The emitter to query
* eventName <string> | <symbol> The event name

A class method that returns the number of listeners for the given eventName registered on the given emitter.

```js
const myEmitter = new MyEmitter();
myEmitter.on('event', () => {});
myEmitter.on('event', () => {});
console.log(EventEmitter.listenerCount(myEmitter, 'event'));
// Prints: 2
```

### EventEmitter.defaultMaxListeners

默认情况下，每个事件可以注册最多 10 个监听器。 可以使用 emitter.setMaxListeners(n) 方法改变单个 EventEmitter 实例的限制。 可以使用 EventEmitter.defaultMaxListeners 属性改变所有 EventEmitter 实例的默认值。 如果此值不是一个正数，则抛出 TypeError。

设置 EventEmitter.defaultMaxListeners 要谨慎，因为会影响所有 EventEmitter 实例，包括之前创建的。 因而，优先使用 emitter.setMaxListeners(n) 而不是 EventEmitter.defaultMaxListeners。

限制不是硬性的。 EventEmitter 实例可以添加超过限制的监听器，但会向 stderr 输出跟踪警告，表明检测到可能的内存泄漏。 对于单个 EventEmitter 实例，可以使用 emitter.getMaxListeners() 和 emitter.setMaxListeners() 暂时地消除警告：

```js
emitter.setMaxListeners(emitter.getMaxListeners() + 1);
emitter.once('event', () => {
  // 做些操作
  emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0));
});
```

--trace-warnings 命令行标志可用于显示此类警告的堆栈跟踪。

触发的警告可以通过 process.on('warning') 进行检查，并具有附加的 emitter、 type 和 count 属性，分别指向事件触发器实例、事件名称、以及附加的监听器数量。 其 name 属性设置为 'MaxListenersExceededWarning'。

### emitter.addListener(eventName, listener)

* eventName <string> | <symbol>
* listener <Function>

emitter.on(eventName, listener) 的别名。

### emitter.emit(eventName[, ...args])

* eventName <string> | <symbol>
* ...args <any>
* 返回: <boolean>

按照监听器注册的顺序，同步地调用每个注册到名为 eventName 的事件的监听器，并传入提供的参数。

如果事件有监听器，则返回 true，否则返回 false。

```js
const EventEmitter = require('events');
const myEmitter = new EventEmitter();

// 第一个监听器。
myEmitter.on('event', function firstListener() {
  console.log('第一个监听器');
});
// 第二个监听器。
myEmitter.on('event', function secondListener(arg1, arg2) {
  console.log(`第二个监听器中的事件有参数 ${arg1}、${arg2}`);
});
// 第三个监听器
myEmitter.on('event', function thirdListener(...args) {
  const parameters = args.join(', ');
  console.log(`第三个监听器中的事件有参数 ${parameters}`);
});

console.log(myEmitter.listeners('event'));

myEmitter.emit('event', 1, 2, 3, 4, 5);

// Prints:
// [
//   [Function: firstListener],
//   [Function: secondListener],
//   [Function: thirdListener]
// ]
// 第一个监听器
// 第二个监听器中的事件有参数 1、2
// 第三个监听器中的事件有参数 1, 2, 3, 4, 5
```

### emitter.eventNames()

* 返回: <Array>

返回已注册监听器的事件名数组。 数组中的值为字符串或 Symbol。

```js
const EventEmitter = require('events');
const myEE = new EventEmitter();
myEE.on('foo', () => {});
myEE.on('bar', () => {});

const sym = Symbol('symbol');
myEE.on(sym, () => {});

console.log(myEE.eventNames());
// 打印: [ 'foo', 'bar', Symbol(symbol) ]
```

### emitter.getMaxListeners()

* 返回: <integer>

返回 EventEmitter 当前的监听器最大限制数的值，该值可以使用 emitter.setMaxListeners(n) 设置或默认为 EventEmitter.defaultMaxListeners。

### emitter.listenerCount(eventName)

* eventName <string> | <symbol> 正在监听的事件名。
* 返回: <integer>

返回正在监听的名为 eventName 的事件的监听器的数量。

### emitter.listeners(eventName)

* eventName <string> | <symbol>
* 返回: <Function[]>

返回名为 eventName 的事件的监听器数组的副本。

```js
server.on('connection', (stream) => {
  console.log('有连接');
});
console.log(util.inspect(server.listeners('connection')));
// 打印: [ [Function] ]
```

### emitter.off(eventName, listener)

* eventName <string> | <symbol>
* listener <Function>
* 返回: <EventEmitter>

emitter.removeListener() 的别名。

### emitter.on(eventName, listener)

* eventName <string> | <symbol> 事件名称。
* listener <Function> 回调函数。
* 返回: <EventEmitter>

添加 listener 函数到名为 eventName 的事件的监听器数组的末尾。 不会检查 listener 是否已被添加。 多次调用并传入相同的 eventName 与 listener 会导致 listener 会被添加多次。

```js
server.on('connection', (stream) => {
  console.log('已连接');
});
```

返回对 EventEmitter 的引用，以便可以链式调用。

默认情况下，事件监听器会按照添加的顺序依次调用。 emitter.prependListener() 方法可用于将事件监听器添加到监听器数组的开头。

```js
const myEE = new EventEmitter();
myEE.on('foo', () => console.log('a'));
myEE.prependListener('foo', () => console.log('b'));
myEE.emit('foo');
// 打印:
//   b
//   a
```

### emitter.once(eventName, listener)

* eventName <string> | <symbol> 事件名称。
* listener <Function> 回调函数。
* 返回: <EventEmitter>

添加单次监听器 listener 到名为 eventName 的事件。 当 eventName 事件下次触发时，监听器会先被移除，然后再调用。

```js
server.once('connection', (stream) => {
  console.log('第一次调用');
});
```

返回对 EventEmitter 的引用，以便可以链式调用。

默认情况下，事件监听器会按照添加的顺序依次调用。 emitter.prependOnceListener() 方法可用于将事件监听器添加到监听器数组的开头。

```js
const myEE = new EventEmitter();
myEE.once('foo', () => console.log('a'));
myEE.prependOnceListener('foo', () => console.log('b'));
myEE.emit('foo');
// 打印:
//   b
//   a
```

### emitter.prependListener(eventName, listener)

* eventName <string> | <symbol> 事件名称。
* listener <Function> 回调函数。
* 返回: <EventEmitter>

添加 listener 函数到名为 eventName 的事件的监听器数组的开头。 不会检查 listener 是否已被添加。 多次调用并传入相同的 eventName 和 listener 会导致 listener 被添加多次。

```js
server.prependListener('connection', (stream) => {
  console.log('已连接');
});
```
返回对 EventEmitter 的引用，以便可以链式调用。

### emitter.prependOnceListener(eventName, listener)

* eventName <string> | <symbol> 事件名称。
* listener <Function> 回调函数。
* 返回: <EventEmitter>

添加单次监听器 listener 到名为 eventName 的事件的监听器数组的开头。 当 eventName 事件下次触发时，监听器会先被移除，然后再调用。

```js
server.prependOnceListener('connection', (stream) => {
  console.log('第一次调用');
});
```

返回对 EventEmitter 的引用，以便可以链式调用。

### emitter.removeAllListeners([eventName])

* eventName <string> | <symbol>
* 返回: <EventEmitter>

移除全部监听器或指定的 eventName 事件的监听器。

删除代码中其他位置添加的监听器是不好的做法，尤其是当 EventEmitter 实例是由某些其他组件或模块（例如套接字或文件流）创建时。

返回对 EventEmitter 的引用，以便可以链式调用。

### emitter.removeListener(eventName, listener)

* eventName <string> | <symbol>
* listener <Function>
* 返回: <EventEmitter>

从名为 eventName 的事件的监听器数组中移除指定的 listener。

```js
const callback = (stream) => {
  console.log('已连接');
};
server.on('connection', callback);
// ...
server.removeListener('connection', callback);
```

removeListener() 最多只会从监听器数组中移除一个监听器。 如果监听器被多次添加到指定 eventName 的监听器数组中，则必须多次调用 removeListener() 才能移除所有实例。

一旦事件被触发，所有绑定到该事件的监听器都会按顺序依次调用。 这意味着，在事件触发之后、且最后一个监听器执行完成之前， removeListener() 或 removeAllListeners() 不会从 emit() 中移除它们。

```js
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
```

因为监听器是使用内部数组进行管理的，所以调用它将更改在删除监听器后注册的任何监听器的位置索引。 这不会影响调用监听器的顺序，但这意味着需要重新创建由 emitter.listeners() 方法返回的监听器数组的任何副本。

如果单个函数作为处理程序多次添加为单个事件（如下例所示），则 removeListener() 将删除最近添加的实例。 在示例中，删除了监听器 once('ping')：

```js
const ee = new EventEmitter();

function pong() {
  console.log('pong');
}

ee.on('ping', pong);
ee.once('ping', pong);
ee.removeListener('ping', pong);

ee.emit('ping');
ee.emit('ping');
```

返回对 EventEmitter 的引用，以便可以链式调用。

### emitter.setMaxListeners(n)

* n <integer>
* 返回: <EventEmitter>

默认情况下，如果为特定事件添加了超过 10 个监听器，则 EventEmitter 会打印一个警告。 这有助于发现内存泄露。 但是，并不是所有的事件都要限制 10 个监听器。 emitter.setMaxListeners() 方法可以为指定的 EventEmitter 实例修改限制。 值设为 Infinity（或 0）表示不限制监听器的数量。

返回对 EventEmitter 的引用，以便可以链式调用。

### emitter.rawListeners(eventName)

* eventName <string> | <symbol>
* 返回: <Function[]>

返回 eventName 事件的监听器数组的拷贝，包括封装的监听器（例如由 .once() 创建的）。

```js
const emitter = new EventEmitter();
emitter.once('log', () => console.log('只记录一次'));

// 返回一个数组，包含了一个封装了 `listener` 方法的监听器。
const listeners = emitter.rawListeners('log');
const logFnWrapper = listeners[0];

// 打印 “只记录一次”，但不会解绑 `once` 事件。
logFnWrapper.listener();

// 打印 “只记录一次”，且移除监听器。
logFnWrapper();

emitter.on('log', () => console.log('持续地记录'));
// 返回一个数组，只包含 `.on()` 绑定的监听器。
const newListeners = emitter.rawListeners('log');

// 打印两次 “持续地记录”。
newListeners[0]();
emitter.emit('log');
```

## events.once(emitter, name)

* emitter <EventEmitter>
* name <string>
* 返回: <Promise>

创建一个 Promise，当 EventEmitter 触发给定的事件时则会被解决，当 EventEmitter 触发 'error' 时则会被拒绝。 解决 Promise 时将会带上触发到给定事件的所有参数的数组。

此方法是有意通用的，并且可与 Web 平台的 EventTarget 接口一起使用，该接口没有特殊的 'error' 事件语义且不监听 'error' 事件。

```js
const { once, EventEmitter } = require('events');

async function run() {
  const ee = new EventEmitter();

  process.nextTick(() => {
    ee.emit('myevent', 42);
  });

  const [value] = await once(ee, 'myevent');
  console.log(value);

  const err = new Error('错误信息');
  process.nextTick(() => {
    ee.emit('error', err);
  });

  try {
    await once(ee, 'myevent');
  } catch (err) {
    console.log('出错', err);
  }
}

run();
```
