# stream(流)

[本部分文档](http://nodejs.cn/api/stream.html)

流（stream）是 Node.js 中处理流式数据的抽象接口。 stream 模块用于构建实现了流接口的对象。

Node.js 提供了多种流对象。 例如，HTTP 服务器的请求和 process.stdout 都是流的实例。

流可以是可读的、可写的、或者可读可写的。 所有的流都是 EventEmitter 的实例。

访问 stream 模块：

```js
const stream = require('stream');
```

尽管理解流的工作方式很重要，但是 stream 模块主要用于开发者创建新类型的流实例。 对于以消费流对象为主的开发者，极少需要直接使用 stream 模块。

## 本文档的组织结构

本文档分为两个主要章节，外加其他注意事项作为第三章节。 第一章节阐述了在应用程序中使用流时需要的 API。 第二章节阐述了实现新类型的流时需要的 API。

## 流的类型

Node.js 中有四种基本的流类型：

* Writable - 可写入数据的流（例如 fs.createWriteStream()）。
* Readable - 可读取数据的流（例如 fs.createReadStream()）。
* Duplex - 可读又可写的流（例如 net.Socket）。
* Transform - 在读写过程中可以修改或转换数据的 Duplex 流（例如 zlib.createDeflate()）。

此外，该模块还包括实用函数 stream.pipeline()、stream.finished() 和 stream.Readable.from()。

### 对象模式

Node.js 创建的流都是运作在字符串和 Buffer（或 Uint8Array）上。 当然，流的实现也可以使用其它类型的 JavaScript 值（除了 null）。 这些流会以“对象模式”进行操作。

当创建流时，可以使用 objectMode 选项把流实例切换到对象模式。 将已存在的流切换到对象模式是不安全的。

### 缓冲

可写流和可读流都会在内部的缓冲器中存储数据，可以分别使用的 writable.writableBuffer 或 readable.readableBuffer 来获取。

可缓冲的数据大小取决于传入流构造函数的 highWaterMark 选项。 对于普通的流， highWaterMark 指定了字节的总数。 对于对象模式的流， highWaterMark 指定了对象的总数。

当调用 stream.push(chunk) 时，数据会被缓冲在可读流中。 如果流的消费者没有调用 stream.read()，则数据会保留在内部队列中直到被消费。

一旦内部的可读缓冲的总大小达到 highWaterMark 指定的阈值时，流会暂时停止从底层资源读取数据，直到当前缓冲的数据被消费 （也就是说，流会停止调用内部的用于填充可读缓冲的 readable._read()）。

当调用 writable.write(chunk) 时，数据会被缓冲在可写流中。 当内部的可写缓冲的总大小小于 highWaterMark 设置的阈值时，调用 writable.write() 会返回 true。 一旦内部缓冲的大小达到或超过 highWaterMark 时，则会返回 false。

stream API 的主要目标，特别是 stream.pipe()，是为了限制数据的缓冲到可接受的程度，也就是读写速度不一致的源头与目的地不会压垮内存。

因为 Duplex 和 Transform 都是可读又可写的，所以它们各自维护着两个相互独立的内部缓冲器用于读取和写入， 这使得它们在维护数据流时，读取和写入两边可以各自独立地运作。 例如，net.Socket 实例是 Duplex 流，它的可读端可以消费从 socket 接收的数据，而可写端则可以将数据写入到 socket。 因为数据写入到 socket 的速度可能比接收数据的速度快或者慢，所以读写两端应该独立地进行操作（或缓冲）。

## 用于消费流的 API

几乎所有的 Node.js 应用都在某种程度上使用了流。 下面是一个例子，使用流实现了一个 HTTP 服务器：

```js
const http = require('http');

const server = http.createServer((req, res) => {
  // req 是一个 http.IncomingMessage 实例，它是可读流。
  // res 是一个 http.ServerResponse 实例，它是可写流。

  let body = '';
  // 接收数据为 utf8 字符串，
  // 如果没有设置字符编码，则会接收到 Buffer 对象。
  req.setEncoding('utf8');

  // 如果添加了监听器，则可读流会触发 'data' 事件。
  req.on('data', (chunk) => {
    body += chunk;
  });

  // 'end' 事件表明整个请求体已被接收。 
  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      // 响应信息给用户。
      res.write(typeof data);
      res.end();
    } catch (er) {
      // json 解析失败。
      res.statusCode = 400;
      return res.end(`错误: ${er.message}`);
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
```

可写流（比如例子中的 res）会暴露了一些方法，比如 write() 和 end() 用于写入数据到流。

当数据可以从流读取时，可读流会使用 EventEmitter API 来通知应用程序。 从流读取数据的方式有很多种。

可写流和可读流都通过多种方式使用 EventEmitter API 来通讯流的当前状态。

Duplex 流和 Transform 流都是可写又可读的。

对于只需写入数据到流或从流消费数据的应用程序，并不需要直接实现流的接口，通常也不需要调用 require('stream')。

对于需要实现新类型的流的开发者，可以参阅用于实现流的API章节。

### 可写流

可写流是对数据要被写入的目的地的一种抽象。

可写流的例子包括：

* 客户端的 HTTP 请求
* 服务器的 HTTP 响应
* fs 的写入流
* zlib 流
* crypto 流
* TCP socket
* 子进程 stdin
* process.stdout、process.stderr

上面的一些例子事实上是实现了可写流接口的 Duplex 流。

所有可写流都实现了 stream.Writable 类定义的接口。

尽管可写流的具体实例可能略有差别，但所有的可写流都遵循同一基本的使用模式，如以下例子所示：

```js
const myStream = getWritableStreamSomehow();
myStream.write('一些数据');
myStream.write('更多数据');
myStream.end('完成写入数据');
```

#### stream.Writable 类

##### 'close' 事件

当流或其底层资源（比如文件描述符）被关闭时触发。 表明不会再触发其他事件，也不会再发生操作。

如果使用 emitClose 选项创建可写流，则它将会始终发出 'close' 事件。

##### 'drain' 事件

如果调用 stream.write(chunk) 返回 false，则当可以继续写入数据到流时会触发 'drain' 事件。

```js
// 向可写流中写入数据一百万次。
// 留意背压（back-pressure）。
function writeOneMillionTimes(writer, data, encoding, callback) {
  let i = 1000000;
  write();
  function write() {
    let ok = true;
    do {
      i--;
      if (i === 0) {
        // 最后一次写入。
        writer.write(data, encoding, callback);
      } else {
        // 检查是否可以继续写入。 
        // 不要传入回调，因为写入还没有结束。
        ok = writer.write(data, encoding);
      }
    } while (i > 0 && ok);
    if (i > 0) {
      // 被提前中止。
      // 当触发 'drain' 事件时继续写入。
      writer.once('drain', write);
    }
  }
}
```

##### 'error' 事件

* <Error>

如果在写入或管道数据时发生错误，则会触发 'error' 事件。 当调用时，监听器回调会传入一个 Error 参数。

除非在创建流时将 autoDestroy 选项设置为 true，否则在触发 'error' 事件时不会关闭流。

##### 'finish' 事件

调用 stream.end() 且缓冲数据都已传给底层系统之后触发。

```js
const writer = getWritableStreamSomehow();
for (let i = 0; i < 100; i++) {
  writer.write(`写入 #${i}!\n`);
}
writer.end('写入结尾\n');
writer.on('finish', () => {
  console.error('写入已完成');
});
```

##### 'pipe' 事件

* src <stream.Readable> 通过管道流入到可写流的来源流。

当在可读流上调用 stream.pipe() 方法时会发出 'pipe' 事件，并将此可写流添加到其目标集。

```js
const writer = getWritableStreamSomehow();
const reader = getReadableStreamSomehow();
writer.on('pipe', (src) => {
  console.log('有数据正通过管道流入写入器');
  assert.equal(src, reader);
});
reader.pipe(writer);
```

##### 'unpipe' 事件

* src <stream.Readable> 要移除可写流管道的来源流。

在可读流上调用 stream.unpipe() 方法时会发出 'unpipe'事件，从其目标集中移除此可写流。

当可读流通过管道流向可写流发生错误时，也会触发此事件。

```js
const writer = getWritableStreamSomehow();
const reader = getReadableStreamSomehow();
writer.on('unpipe', (src) => {
  console.log('已移除可写流管道');
  assert.equal(src, reader);
});
reader.pipe(writer);
reader.unpipe(writer);
```

##### writable.cork()

writable.cork() 方法强制把所有写入的数据都缓冲到内存中。 当调用 stream.uncork() 或 stream.end() 时，缓冲的数据才会被输出。

当写入大量小块数据到流时，内部缓冲可能失效，从而导致性能下降， writable.cork() 主要用于避免这种情况。 对于这种情况，实现了 writable._writev() 的流可以用更优的方式对写入的数据进行缓冲。

也可参阅：writable.uncork()。

##### writable.destroy([error])

* error <Error> 可选，使用 'error' 事件触发的错误。
* 返回: <this>

销毁流。 可选地触发 'error'，并且触发 'close' 事件（除非将 emitClose 设置为 false）。 调用该方法后，可写流就结束了，之后再调用 write() 或 end() 都会导致 ERR_STREAM_DESTROYED 错误。 这是销毁流的最直接的方式。 前面对 write() 的调用可能没有耗尽，并且可能触发 ERR_STREAM_DESTROYED 错误。 如果数据在关闭之前应该刷新，则使用 end() 而不是销毁，或者在销毁流之前等待 'drain' 事件。 实现者不应该重写此方法，而应该实现 writable._destroy()。

##### writable.destroyed

* <boolean>

在调用了 writable.destroy() 之后为 true。

##### writable.end([chunk[, encoding]][, callback])

* chunk <string> | <Buffer> | <Uint8Array> | <any> 要写入的数据。 对于非对象模式的流， chunk 必须是字符串、 Buffer、或 Uint8Array。 对于对象模式的流， chunk 可以是任何 JavaScript 值，除了 null。
* encoding <string> 如果 chunk 是字符串，则指定字符编码。
* callback <Function> 当流结束时的回调函数。
* 返回: <this>

调用 writable.end() 表明已没有数据要被写入可写流。 可选的 chunk 和 encoding 参数可以在关闭流之前再写入一块数据。 如果传入了 callback 函数，则会做为监听器添加到 'finish' 事件。

调用 stream.end() 之后再调用 stream.write() 会导致错误。

```js
// 先写入 'hello, '，结束前再写入 'world!'。
const fs = require('fs');
const file = fs.createWriteStream('例子.txt');
file.write('hello, ');
file.end('world!');
// 后面不允许再写入数据！
```

##### writable.setDefaultEncoding(encoding)

* encoding <string> 默认的字符编码。
* 返回: <this>

writable.setDefaultEncoding() 方法为可写流设置默认的 encoding。

##### writable.uncork()

writable.uncork() 方法将调用 stream.cork() 后缓冲的所有数据输出到目标。

当使用 writable.cork() 和 writable.uncork() 来管理流的写入缓冲时，建议使用 process.nextTick() 来延迟调用 writable.uncork()。 通过这种方式，可以对单个 Node.js 事件循环中调用的所有 writable.write() 进行批处理。

```js
stream.cork();
stream.write('一些 ');
stream.write('数据 ');
process.nextTick(() => stream.uncork());
```

如果一个流上多次调用 writable.cork()，则必须调用同样次数的 writable.uncork() 才能输出缓冲的数据。

```js
stream.cork();
stream.write('一些 ');
stream.cork();
stream.write('数据 ');
process.nextTick(() => {
  stream.uncork();
  // 数据不会被输出，直到第二次调用 uncork()。
  stream.uncork();
});
```

也可参阅：writable.cork()。

##### writable.writable

* <boolean>

如果调用 writable.write() 是安全的，则为 true。

##### writable.writableEnded

* <boolean>

在调用了 writable.end() 之后为 true。 此属性不表明数据是否已刷新，对此请使用 writable.writableFinished。

##### writable.writableFinished

* <boolean>

在触发 'finish' 事件之前立即设置为 true。

##### writable.writableHighWaterMark

* <number>

返回构造可写流时传入的 highWaterMark 的值。

##### writable.writableLength

此属性包含准备写入的队列中的字节数（或对象）。 该值提供有关 highWaterMark 状态的内省数据。

##### writable.writableObjectMode

* <boolean>

获取用于给定 Writable 流的 objectMode 属性。

##### writable.write(chunk[, encoding][, callback])

* chunk <string> | <Buffer> | <Uint8Array> | <any> 要写入的数据。  对于非对象模式的流， chunk 必须是字符串、 Buffer 或 Uint8Array。 对于对象模式的流， chunk 可以是任何 JavaScript 值，除了 null。
* encoding <string> 如果 chunk 是字符串，则指定字符编码。
* callback <Function> 当数据块被输出到目标后的回调函数。
* 返回: <boolean> 如果流需要等待 'drain' 事件触发才能继续写入更多数据，则返回 false，否则返回 true。

writable.write() 写入数据到流，并在数据被完全处理之后调用 callback。 如果发生错误，则 callback 可能被调用也可能不被调用。 为了可靠地检测错误，可以为 'error' 事件添加监听器。

在接收了 chunk 后，如果内部的缓冲小于创建流时配置的 highWaterMark，则返回 true 。 如果返回 false ，则应该停止向流写入数据，直到 'drain' 事件被触发。

当流还未被排空时，调用 write() 会缓冲 chunk，并返回 false。 一旦所有当前缓冲的数据块都被排空了（被操作系统接收并传输），则触发 'drain' 事件。 建议一旦 write() 返回 false，则不再写入任何数据块，直到 'drain' 事件被触发。 当流还未被排空时，也是可以调用 write()，Node.js 会缓冲所有被写入的数据块，直到达到最大内存占用，这时它会无条件中止。 甚至在它中止之前， 高内存占用将会导致垃圾回收器的性能变差和 RSS 变高（即使内存不再需要，通常也不会被释放回系统）。 如果远程的另一端没有读取数据，TCP 的 socket 可能永远也不会排空，所以写入到一个不会排空的 socket 可能会导致远程可利用的漏洞。

对于 Transform, 写入数据到一个不会排空的流尤其成问题，因为 Transform 流默认会被暂停，直到它们被 pipe 或者添加了 'data' 或 'readable' 事件句柄。

如果要被写入的数据可以根据需要生成或者取得，建议将逻辑封装为一个可读流并且使用 stream.pipe()。 如果要优先调用 write()，则可以使用 'drain' 事件来防止背压与避免内存问题:

```js
function write(data, cb) {
  if (!stream.write(data)) {
    stream.once('drain', cb);
  } else {
    process.nextTick(cb);
  }
}

// 在回调函数被执行后再进行其他的写入。
write('hello', () => {
  console.log('完成写入，可以进行更多的写入');
});
```

对象模式下的可写流将会始终忽略 encoding 参数。

### 可读流

可读流是对提供数据的来源的一种抽象。

可读流的例子包括：

* 客户端的 HTTP 响应
* 服务器的 HTTP 请求
* fs 的读取流
* zlib 流
* crypto 流
* TCP socket
* 子进程 stdout 与 stderr
* process.stdin

所有可读流都实现了 stream.Readable 类定义的接口。

#### 两种读取模式

可读流运作于两种模式之一：流动模式（flowing）或暂停模式（paused）。 这些模式与对象模式分开。 无论是否处于流动模式或暂停模式，可读流都可以处于对象模式。

* 在流动模式中，数据自动从底层系统读取，并通过 EventEmitter 接口的事件尽可能快地被提供给应用程序。
* 在暂停模式中，必须显式调用 stream.read() 读取数据块。

所有可读流都开始于暂停模式，可以通过以下方式切换到流动模式：

* 添加 'data' 事件句柄。
* 调用 stream.resume() 方法。
* 调用 stream.pipe() 方法将数据发送到可写流。

可读流可以通过以下方式切换回暂停模式：

* 如果没有管道目标，则调用 stream.pause()。
* 如果有管道目标，则移除所有管道目标。调用 stream.unpipe() 可以移除多个管道目标。

只有提供了消费或忽略数据的机制后，可读流才会产生数据。 如果消费的机制被禁用或移除，则可读流会停止产生数据。

为了向后兼容，移除 'data' 事件句柄不会自动地暂停流。 如果有管道目标，一旦目标变为 drain 状态并请求接收数据时，则调用 stream.pause() 也不能保证流会保持暂停模式。

如果可读流切换到流动模式，且没有可用的消费者来处理数据，则数据将会丢失。 例如，当调用 readable.resume() 时，没有监听 'data' 事件或 'data' 事件句柄已移除。

添加 'readable' 事件句柄会使流自动停止流动，并通过 readable.read() 消费数据。 如果 'readable' 事件句柄被移除，且存在 'data' 事件句柄，则流会再次开始流动。

#### 三种状态

可读流的两种模式是对发生在可读流中更加复杂的内部状态管理的一种简化的抽象。

在任意时刻，可读流会处于以下三种状态之一：

* readable.readableFlowing === null
* readable.readableFlowing === false
* readable.readableFlowing === true

当 readable.readableFlowing 为 null 时，没有提供消费流数据的机制，所以流不会产生数据。 在这个状态下，监听 'data' 事件、调用 readable.pipe()、或调用 readable.resume() 都会使 readable.readableFlowing 切换到 true，可读流开始主动地产生数据并触发事件。

调用 readable.pause()、 readable.unpipe()、或接收到背压，则 readable.readableFlowing 会被设为 false，暂时停止事件流动但不会停止数据的生成。 在这个状态下，为 'data' 事件绑定监听器不会使 readable.readableFlowing 切换到 true。

```js
const { PassThrough, Writable } = require('stream');
const pass = new PassThrough();
const writable = new Writable();

pass.pipe(writable);
pass.unpipe(writable);
// readableFlowing 现在为 false。

pass.on('data', (chunk) => { console.log(chunk.toString()); });
pass.write('ok'); // 不会触发 'data' 事件。
pass.resume(); // 必须调用它才会触发 'data' 事件。
```

当 readable.readableFlowing 为 false 时，数据可能会堆积在流的内部缓冲中。

#### 选择一种接口风格

可读流的 API 贯穿了多个 Node.js 版本，且提供了多种方法来消费流数据。 开发者通常应该选择其中一种方法来消费数据，不要在单个流使用多种方法来消费数据。 混合使用 on('data')、 on('readable')、 pipe() 或异步迭代器，会导致不明确的行为。

对于大多数用户，建议使用 readable.pipe()，因为它是消费流数据最简单的方式。 如果开发者需要精细地控制数据的传递与产生，可以使用 EventEmitter、 readable.on('readable')/readable.read() 或 readable.pause()/readable.resume()。

#### stream.Readable 类

##### 'close' 事件

当流或其底层资源（比如文件描述符）被关闭时触发 'close' 事件。 该事件表明不会再触发其他事件，也不会再发生操作。

如果使用 emitClose 选项创建可读流，则它将会始终发出 'close' 事件。

##### 'data' 事件

* chunk <Buffer> | <string> | <any> 数据块。 对于非对象模式的流， chunk 可以是字符串或 Buffer。 对于对象模式的流， chunk 可以是任何 JavaScript 值，除了 null。

当流将数据块传送给消费者后触发。 当调用 readable.pipe()， readable.resume() 或绑定监听器到 'data' 事件时，流会转换到流动模式。 当调用 readable.read() 且有数据块返回时，也会触发 'data' 事件。

将 'data' 事件监听器附加到尚未显式暂停的流将会使流切换为流动模式。 数据将会在可用时立即传递。

如果使用 readable.setEncoding() 为流指定了默认的字符编码，则监听器回调传入的数据为字符串，否则传入的数据为 Buffer。

```js
const readable = getReadableStreamSomehow();
readable.on('data', (chunk) => {
  console.log(`接收到 ${chunk.length} 个字节的数据`);
});
```

##### 'end' 事件

当流中没有数据可供消费时触发。

'end' 事件只有在数据被完全消费掉后才会触发。 要想触发该事件，可以将流转换到流动模式，或反复调用 stream.read() 直到数据被消费完。

```js
const readable = getReadableStreamSomehow();
readable.on('data', (chunk) => {
  console.log(`接收到 ${chunk.length} 个字节的数据`);
});
readable.on('end', () => {
  console.log('已没有数据');
});
```

##### 'error' 事件

* <Error>

'error' 事件可能随时由 Readable 实现触发。 通常，如果底层的流由于底层内部的故障而无法生成数据，或者流的实现尝试推送无效的数据块，则可能会发生这种情况。

监听器回调将会传入一个 Error 对象。

##### 'pause' 事件

当调用 stream.pause() 并且 readsFlowing 不为 false 时，就会触发 'pause' 事件。

##### 'readable' 事件

当有数据可从流中读取时，就会触发 'readable' 事件。 在某些情况下，为 'readable' 事件附加监听器将会导致将一些数据读入内部缓冲区。

```js
const readable = getReadableStreamSomehow();
readable.on('readable', function() {
  // 有数据可读取。
  let data;

  while (data = this.read()) {
    console.log(data);
  }
});
```

当到达流数据的尽头时， 'readable' 事件也会触发，但是在 'end' 事件之前触发。

'readable' 事件表明流有新的动态：要么有新的数据，要么到达流的尽头。 对于前者，stream.read() 会返回可用的数据。 对于后者，stream.read() 会返回 null。 例如，下面的例子中， foo.txt 是一个空文件：

```js
const fs = require('fs');
const rr = fs.createReadStream('foo.txt');
rr.on('readable', () => {
  console.log(`读取的数据: ${rr.read()}`);
});
rr.on('end', () => {
  console.log('结束');
});
```

运行上面的脚本输出如下：

```shell
$ node test.js
读取的数据: null
结束
```

通常情况下， readable.pipe() 和 'data' 事件的机制比 'readable' 事件更容易理解。 处理 'readable' 事件可能造成吞吐量升高。

如果同时使用 'readable' 事件和 'data' 事件，则 'readable' 事件会优先控制流，也就是说，当调用 stream.read() 时才会触发 'data' 事件。 readableFlowing 属性会变成 false。 当移除 'readable' 事件时，如果存在 'data' 事件监听器，则流会开始流动，也就是说，无需调用 .resume() 也会触发 'data' 事件。

##### 'resume' 事件

当调用 stream.resume() 并且 readsFlowing 不为 true 时，将会触发 'resume' 事件。

##### readable.destroy([error])

* error <Error> 将会在 'error' 事件中作为负载传入的错误。
* 返回: <this>

销毁流。 可选地触发 'error' 事件，并触发 'close' 事件（除非将 emitClose 设置为 false）。 在此调用之后，可读流将会释放所有内部的资源，并且将会忽略对 push() 的后续调用。 实现者不应该重写此方法，而应该实现 readable._destroy()。

##### readable.destroyed

* <boolean>

在调用 readable.destroy() 之后为 true。

##### readable.isPaused()

* 返回： <boolean>

readable.isPaused() 方法返回可读流当前的操作状态。 主要用于 readable.pipe() 底层的机制。 大多数情况下无需直接使用该方法。

```js
const readable = new stream.Readable();

readable.isPaused(); // === false
readable.pause();
readable.isPaused(); // === true
readable.resume();
readable.isPaused(); // === false
```

##### readable.pause()

* 返回: <this>

readable.pause() 方法使流动模式的流停止触发 'data' 事件，并切换出流动模式。 任何可用的数据都会保留在内部缓存中。

```js
const readable = getReadableStreamSomehow();
readable.on('data', (chunk) => {
  console.log(`接收到 ${chunk.length} 字节的数据`);
  readable.pause();
  console.log('暂停一秒');
  setTimeout(() => {
    console.log('数据重新开始流动');
    readable.resume();
  }, 1000);
});
```

如果存在 'readable' 事件监听器，则 readable.pause() 方法不起作用。

##### readable.pipe(destination[, options])

* destination <stream.Writable> 数据写入的目标。
* options <Object> 管道选项。
    * end <boolean> 当读取器结束时终止写入器。默认值: true。
* 返回: <stream.Writable> 目标可写流，如果是 Duplex 流或 Transform 流则可以形成管道链。

readable.pipe() 方法绑定可写流到可读流，将可读流自动切换到流动模式，并将可读流的所有数据推送到绑定的可写流。 数据流会被自动管理，所以即使可读流更快，目标可写流也不会超负荷。

例子，将可读流的所有数据通过管道推送到 file.txt 文件：

```js
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// readable 的所有数据都推送到 'file.txt'。
readable.pipe(writable);
```

可以在单个可读流上绑定多个可写流。

readable.pipe() 会返回目标流的引用，这样就可以对流进行链式地管道操作：

```js
const fs = require('fs');
const r = fs.createReadStream('file.txt');
const z = zlib.createGzip();
const w = fs.createWriteStream('file.txt.gz');
r.pipe(z).pipe(w);
```

默认情况下，当来源可读流触发 'end' 事件时，目标可写流也会调用 stream.end() 结束写入。 若要禁用这种默认行为， end 选项应设为 false，这样目标流就会保持打开：

```js
reader.pipe(writer, { end: false });
reader.on('end', () => {
  writer.end('结束');
});
```

如果可读流在处理期间发送错误，则可写流目标不会自动关闭。 如果发生错误，则需要手动关闭每个流以防止内存泄漏。

process.stderr 和 process.stdout 可写流在 Node.js 进程退出之前永远不会关闭，无论指定的选项如何。

##### readable.read([size])

* size <number> 要读取的数据的字节数。
* 返回: <string> | <Buffer> | <null> | <any>

从内部缓冲拉取并返回数据。 如果没有可读的数据，则返回 null。 默认情况下， readable.read() 返回的数据是 Buffer 对象，除非使用 readable.setEncoding() 指定字符编码或流处于对象模式。

可选的 size 参数指定要读取的特定字节数。 如果无法读取 size 个字节，则除非流已结束，否则将会返回 null，在这种情况下，将会返回内部 buffer 中剩余的所有数据。

如果没有指定 size 参数，则返回内部缓冲中的所有数据。

readable.read() 应该只对处于暂停模式的可读流调用。 在流动模式中， readable.read() 会自动调用直到内部缓冲的数据完全耗尽。

```js
const readable = getReadableStreamSomehow();
readable.on('readable', () => {
  let chunk;
  while (null !== (chunk = readable.read())) {
    console.log(`接收到 ${chunk.length} 字节的数据`);
  }
});
```

使用 readable.read() 处理数据时， while 循环是必需的。 只有在 readable.read() 返回 null 之后，才会触发 'readable'。

对象模式下的可读流将会始终从调用 readable.read(size) 返回单个子项，而不管 size 参数的值如何。

如果 readable.read() 返回一个数据块，则 'data' 事件也会触发。

在 'end' 事件触发后再调用 stream.read([size]) 会返回 null。 不会引发运行时错误。

##### readable.readable

* <boolean>

如果可以安全地调用 readable.read()，则为 true。

##### readable.readableEncoding

* <null> | <string>

获取用于给定可读流的 encoding 属性。 可以使用 readable.setEncoding() 方法设置 encoding 属性。

##### readable.readableEnded

* <boolean>

当 'end' 事件被触发时变为 true。

##### readable.readableFlowing

* <boolean>

This property reflects the current state of a Readable stream as described in the Stream Three States section.

##### readable.readableHighWaterMark

* 返回: <number>

返回构造可读流时传入的 highWaterMark 的值。

##### readable.readableLength

* <number>

此属性包含准备读取的队列中的字节数（或对象数）。 该值提供有关 highWaterMark 状态的内省数据。

##### readable.readableObjectMode

* <boolean>

获取用于给定可读流的 objectMode 属性。

##### readable.resume()

* 返回: <this>

readable.resume() 方法将被暂停的可读流恢复触发 'data' 事件，并将流切换到流动模式。

readable.resume() 方法可以用来充分消耗流中的数据，但无需实际处理任何数据：

```js
getReadableStreamSomehow()
  .resume()
  .on('end', () => {
    console.log('到达流的尽头，但无需读取任何数据');
  });
```

当存在 'readable' 事件监听器时， readable.resume() 方法不起作用。

##### readable.setEncoding(encoding)

* encoding <string> 字符编码。
* 返回: <this>

readable.setEncoding() 方法为从可读流读取的数据设置字符编码。

默认情况下没有设置字符编码，流数据返回的是 Buffer 对象。 如果设置了字符编码，则流数据返回指定编码的字符串。 例如，调用 readable.setEncoding('utf-8') 会将数据解析为 UTF-8 数据，并返回字符串，调用 readable.setEncoding('hex') 则会将数据编码成十六进制字符串。

可读流将会正确地处理通过流传递的多字节字符，否则如果简单地从流中作为 Buffer 对象拉出，则会被不正确地解码。

```js
const readable = getReadableStreamSomehow();
readable.setEncoding('utf8');
readable.on('data', (chunk) => {
  assert.equal(typeof chunk, 'string');
  console.log('读取到 %d 个字符的字符串数据', chunk.length);
});
```

##### readable.unpipe([destination])

* destination <stream.Writable> 要移除管道的可写流。
* 返回: <this>

readable.unpipe() 方法解绑之前使用 stream.pipe() 方法绑定的可写流。

如果没有指定 destination, 则解绑所有管道.

如果指定了 destination, 但它没有建立管道，则不起作用.

```js
const fs = require('fs');
const readable = getReadableStreamSomehow();
const writable = fs.createWriteStream('file.txt');
// 可读流的所有数据开始传输到 'file.txt'，但一秒后停止。
readable.pipe(writable);
setTimeout(() => {
  console.log('停止写入 file.txt');
  readable.unpipe(writable);
  console.log('手动关闭文件流');
  writable.end();
}, 1000);
```

##### readable.unshift(chunk[, encoding])

* chunk <Buffer> | <Uint8Array> | <string> | <null> | <any> 要推回可读队列的数据块。 对于非对象模式的流， chunk 必须是字符串、 Buffer、 Uint8Array 或 null。 对于对象模式的流， chunk 可以是任何 JavaScript 值。
* encoding <string> 字符串块的编码。 必须是有效的 Buffer 编码，例如 'utf8' 或 'ascii'。

将 chunk 作为 null 传递信号表示流的末尾（EOF），其行为与 readable.push(null) 相同，之后不能再写入数据。 EOF 信号会被放在 buffer 的末尾，任何缓冲的数据仍将会被刷新。

readable.unshift() 方法将数据块推回内部缓冲。 可用于以下情景：正被消费中的流需要将一些已经被拉出的数据重置为未消费状态，以便这些数据可以传给其他方。

触发 'end' 事件或抛出运行时错误之后，不能再调用 stream.unshift() 方法。

使用 stream.unshift() 的开发者可以考虑切换到 Transform 流。 详见用于实现流的API。

```js
// 拉出由 \n\n 分隔的标题。
// 如果获取太多，则使用 unshift()。
// 使用 (error, header, stream) 调用回调。
const { StringDecoder } = require('string_decoder');
function parseHeader(stream, callback) {
  stream.on('error', callback);
  stream.on('readable', onReadable);
  const decoder = new StringDecoder('utf8');
  let header = '';
  function onReadable() {
    let chunk;
    while (null !== (chunk = stream.read())) {
      const str = decoder.write(chunk);
      if (str.match(/\n\n/)) {
        // 发现头部边界。
        const split = str.split(/\n\n/);
        header += split.shift();
        const remaining = split.join('\n\n');
        const buf = Buffer.from(remaining, 'utf8');
        stream.removeListener('error', callback);
        // 在调用 unshift() 前移除 'readable' 监听器。
        stream.removeListener('readable', onReadable);
        if (buf.length)
          stream.unshift(buf);
        // 现在可以从流中读取消息的主体。
        callback(null, header, stream);
      } else {
        // 继续读取头部。
        header += str;
      }
    }
  }
}
```

与 stream.push(chunk) 不同， stream.unshift(chunk) 不会通过重置流的内部读取状态来结束读取过程。 如果在读取期间调用 readable.unshift()（即从自定义的流上的 stream._read() 实现中调用），则会导致意外结果。 在使用立即的 stream.push('') 调用 readable.unshift() 之后，将适当地重置读取状态，但最好在执行读取的过程中避免调用 readable.unshift()。

##### readable.wrap(stream)

* stream <Stream> 老版本的可读流。
* 返回: <this>

在 Node.js v0.10 之前，流没有实现当前定义的所有的流模块 API。（详见兼容性）

当使用老版本的 Node.js 时，只能触发 'data' 事件或调用 stream.pause() 方法，可以使用 readable.wrap() 创建老版本的流作为数据源。

现在几乎无需使用 readable.wrap()，该方法主要用于老版本的 Node.js 应用和库。

```js
const { OldReader } = require('./old-api-module.js');
const { Readable } = require('stream');
const oreader = new OldReader();
const myReader = new Readable().wrap(oreader);

myReader.on('readable', () => {
  myReader.read(); // 各种操作。
});
```

##### readable[Symbol.asyncIterator]()

* 返回: <AsyncIterator> 用于完全地消费流。

```js
const fs = require('fs');

async function print(readable) {
  readable.setEncoding('utf8');
  let data = '';
  for await (const chunk of readable) {
    data += chunk;
  }
  console.log(data);
}
print(fs.createReadStream('file')).catch(console.error);
```

如果循环以 break 或 throw 终止，则流将会被销毁。 换句话说，迭代流将完全地消费流。 将以大小等于 highWaterMark 选项的块读取流。 在上面的代码示例中，如果文件的数据少于 64kb，则数据将位于单个块中，因为没有为 fs.createReadStream() 提供 highWaterMark 选项。

### 双工流与转换流

#### stream.Duplex 类

双工流（Duplex）是同时实现了 Readable 和 Writable 接口的流。

Duplex 流的例子包括：

* TCP socket
* zlib 流
* crypto 流

#### stream.Transform 类

转换流（Transform）是一种 Duplex 流，但它的输出与输入是相关联的。 与 Duplex 流一样， Transform 流也同时实现了 Readable 和 Writable 接口。

Transform 流的例子包括：

* zlib 流
* crypto 流

##### transform.destroy([error])

* error <Error>

销毁流，并可选地触发 'error' 事件。 调用该方法后，transform 流会释放全部内部资源。 实现者不应该重写此方法，而应该实现 readable._destroy()。 Transform 流的 _destroy() 方法的默认实现会触发 'close' 事件，除非 emitClose 被设置为 false。

### stream.finished(stream[, options], callback)

* stream <Stream> 可读和/或可写流。
* options <Object>
    * error <boolean> 如果设置为 false，则对 emit('error', err) 的调用不会被视为已完成。 默认值: true。
    * readable <boolean> 当设置为 false 时，即使流可能仍然可读，当流结束时也将会调用回调。默认值: true。
    * writable <boolean> 当设置为 false 时，即使流可能仍然可写，当流结束时也将会调用回调。默认值: true。
* callback <Function> 带有可选错误参数的回调函数。
* 返回: <Function> 清理函数，它会移除所有已注册的监听器。

当流不再可读、可写、或遇到错误、或过早关闭事件时，则该函数会获得通知。

```js
const { finished } = require('stream');

const rs = fs.createReadStream('archive.tar');

finished(rs, (err) => {
  if (err) {
    console.error('流读取失败', err);
  } else {
    console.log('流已完成读取');
  }
});

rs.resume(); // 排空流。
```

在错误处理场景中特别有用，该场景中的流会被过早地销毁（例如被终止的 HTTP 请求），并且不会触发 'end' 或 'finish' 事件。

finished API 也可以 promise 化：

```js
const finished = util.promisify(stream.finished);

const rs = fs.createReadStream('archive.tar');

async function run() {
  await finished(rs);
  console.log('流已完成读取');
}

run().catch(console.error);
rs.resume(); // 排空流。
```

在调用 callback 之后， stream.finished() 会留下悬挂的事件监听器（特别是 'error'、 'end'、 'finish' 和 'close'）。 这样做的原因是，意外的 'error' 事件（由于错误的流实现）不会导致意外的崩溃。 如果这是不想要的行为，则需要在回调中调用返回的清理函数：

```js
const cleanup = finished(rs, (err) => {
  cleanup();
  // ...
});
```

### stream.pipeline(...streams, callback)

* ...streams <Stream> 要使用管道传送的两个或多个流。
* callback <Function> 当管道完全地完成时调用。
    * err <Error>

一个模块方法，使用管道传送多个流，并转发错误和正确地清理，当管道完成时提供回调。

```js
const { pipeline } = require('stream');
const fs = require('fs');
const zlib = require('zlib');

// 使用 pipeline API 轻松地将一系列的流通过管道一起传送，并在管道完全地完成时获得通知。

// 使用 pipeline 可以有效地压缩一个可能很大的 tar 文件：

pipeline(
  fs.createReadStream('archive.tar'),
  zlib.createGzip(),
  fs.createWriteStream('archive.tar.gz'),
  (err) => {
    if (err) {
      console.error('管道传送失败', err);
    } else {
      console.log('管道传送成功');
    }
  }
);
```

pipeline API 也可以 promise 化：

```js
const pipeline = util.promisify(stream.pipeline);

async function run() {
  await pipeline(
    fs.createReadStream('archive.tar'),
    zlib.createGzip(),
    fs.createWriteStream('archive.tar.gz')
  );
  console.log('管道传送成功');
}

run().catch(console.error);
```

stream.pipeline() 将会在所有的流上调用 stream.destroy(err)，除了：

* 已触发 'end' 或 'close' 的 Readable 流。
* 已触发 'finish' 或 'close' 的 Writable 流。

在调用 callback 之后， stream.pipeline() 会将悬挂的事件监听器留在流上。 在失败后重新使用流的情况下，这可能导致事件监听器泄漏和误吞的错误。

### stream.Readable.from(iterable, [options])

* iterable <Iterable> 实现 Symbol.asyncIterator 或 Symbol.iterator 可迭代协议的对象。
* options <Object> 提供给 new stream.Readable([options]) 的选项。 默认情况下， Readable.from() 会将 options.objectMode 设置为 true，除非通过将 options.objectMode 设置为 false 显式地选择此选项。
* 返回: <stream.Readable>

一个从迭代器中创建可读流的实用方法。

```js
const { Readable } = require('stream');

async function * generate() {
  yield 'hello';
  yield 'streams';
}

const readable = Readable.from(generate());

readable.on('data', (chunk) => {
  console.log(chunk);
});
```

## 用于实现流的 API

stream 模块 API 旨在为了更容易地使用 JavaScript 的原型继承模式来实现流。

首先，流的开发者声明一个新的 JavaScript 类，该类继承了四个基本流类之一（stream.Writeable、 stream.Readable、 stream.Duplex 或 stream.Transform），并确保调用了相应的父类构造函数:

```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor({ highWaterMark, ...options }) {
    super({
      highWaterMark,
      autoDestroy: true,
      emitClose: true
    });
    // ...
  }
}
```

当继承流时，在传入基本构造函数之前，务必清楚使用者可以且应该提供哪些选项。 例如，如果实现需要 autoDestroy 和 emitClose 选项，则不允许使用者覆盖这些选项。 应明确要传入的选项，而不是隐式地传入所有选项。

新的流类必须实现一个或多个特定的方法，具体取决于要创建的流的类型，如下图所示:

用例 | 类 | 需要实现的方法
-|-|-
只读 | Readable | _read()
只写 | Writable | _write()、_writev()、_final()
可读可写 | Duplex | _read()、_write()、_writev()、_final()
对写入的数据进行操作，然后读取结果 | Transform | _transform()、_flush()、_final()

流的实现代码应永远不要调用旨在供消费者使用的公共方法（详见用于消费流的API）。 这样做可能会导致消费流的应用程序代码产生不利的副作用。

### 简单的实现

对于简单的案例，构造流可以不依赖继承。 直接创建 stream.Writable、 stream.Readable、 stream.Duplex 或 stream.Transform 的实例，并传入对应的方法作为构造函数选项。

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    // ...
  }
});
```

### 实现可写流

stream.Writable 类可用于实现 Writable 流。

自定义的 Writable 流必须调用 new stream.Writable([options]) 构造函数并实现 writable._write() 和/或 writable._writev() 方法。

#### new stream.Writable([options])

* options <Object>
    * highWaterMark <number> 当调用 stream.write() 开始返回 false 时的缓冲大小。 默认为 16384 (16kb), 对象模式的流默认为 16。
    * decodeStrings <boolean> 是否把传入 stream._write() 的 string 编码为 Buffer，使用的字符编码为调用 stream.write() 时指定的。 不转换其他类型的数据（即不将 Buffer 解码为 string）。 设置为 false 将会阻止转换 string。 默认值: true。
    * defaultEncoding <string> 当 stream.write() 的参数没有指定字符编码时默认的字符编码。默认值: 'utf8'。
    * objectMode <boolean> 是否可以调用 stream.write(anyObj)。 一旦设为 true，则除了字符串、 Buffer 或 Uint8Array，还可以写入流实现支持的其他 JavaScript 值。默认值: false。
    * emitClose <boolean> 流被销毁后是否触发 'close' 事件。默认值: true。
    * write <Function> 对 stream._write() 方法的实现。
    * writev <Function> 对 stream._writev() 方法的实现。
    * destroy <Function> 对 stream._destroy() 方法的实现。
    * final <Function> 对 stream._final() 方法的实现。
    * autoDestroy <boolean> 此流是否应在结束后自动调用 .destroy()。默认值: false.

```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  constructor(options) {
    // 调用 stream.Writable() 构造函数。
    super(options);
    // ...
  }
}
```

使用 ES6 之前的语法：

```js
const { Writable } = require('stream');
const util = require('util');

function MyWritable(options) {
  if (!(this instanceof MyWritable))
    return new MyWritable(options);
  Writable.call(this, options);
}
util.inherits(MyWritable, Writable);
```

使用简化的构造函数：

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    // ...
  },
  writev(chunks, callback) {
    // ...
  }
});
```

#### writable._write(chunk, encoding, callback)

* chunk <Buffer> | <string> | <any> 要写入的 Buffer，从传给 stream.write() 的 string 转换而来。 如果流的 decodeStrings 选项为 false 或者流在对象模式下运行，则数据块将不会被转换，并且将是传给 stream.write() 的任何内容。
* encoding <string> 如果 chunk 是字符串，则指定字符编码。 如果 chunk 是 Buffer 或者流处于对象模式，则无视该选项。
* callback <Function> 当数据块被处理完成后的回调函数。

所有可写流的实现必须提供 writable._write() 和/或 writable._writev() 方法将数据发送到底层资源。

Transform 流会提供自身实现的 writable._write()。

该函数不能被应用程序代码直接调用。 它应该由子类实现，且只能被内部的 Writable 类的方法调用。

无论是成功完成写入还是写入失败出现错误，都必须调用 callback。 如果调用失败，则 callback 的第一个参数必须是 Error 对象。 如果写入成功，则 callback 的第一个参数为 null。

在 writable._write() 被调用之后且 callback 被调用之前，所有对 writable.write() 的调用都会把要写入的数据缓冲起来。 当调用 callback 时，流将会触发 'drain'事件。 如果流的实现需要同时处理多个数据块，则应该实现 writable._writev() 方法。

如果在构造函数选项中设置 decodeStrings 属性为 false，则 chunk 会保持原样传入 .write()，它可能是字符串而不是 Buffer。 这是为了实现对某些特定字符串数据编码的支持。 在这种情况下， encoding 参数将指示字符串的字符编码。 否则，可以安全地忽略编码参数。

writable._write() 方法有下划线前缀，因为它是在定义在类的内部，不应该被用户程序直接调用。

#### writable._writev(chunks, callback)

* chunks <Object[]> 要写入的多个数据块。 每个数据块的格式为{ chunk: ..., encoding: ... }。
* callback <Function> 当全部数据块被处理完成后的回调函数。

该函数不能被应用程序代码直接调用。 该函数应该由子类实现，且只能被内部的 Writable 类的方法调用。

除了在流实现中的 writable._write() 之外，还可以实现 writable._writev() 方法，其能够一次处理多个数据块。 如果实现了该方法，调用该方法时会传入当前缓冲在写入队列中的所有数据块。

writable._writev() 方法有下划线前缀，因为它是在定义在类的内部，不应该被用户程序直接调用。

#### writable._destroy(err, callback)

* err <Error> 可能发生的错误。
* callback <Function> 回调函数。

_destroy() 方法会被 writable.destroy() 调用。 它可以被子类重写，但不能直接调用。

#### writable._final(callback)

* callback <Function> 当结束写入所有剩余数据时的回调函数。
* _final() 方法不能直接调用。 它应该由子类实现，且只能通过内部的 Writable 类的方法调用。

该方法会在流关闭之前被调用，且在 callback 被调用后触发 'finish' 事件。 主要用于在流结束之前关闭资源或写入缓冲的数据。

#### 写入时的异常处理

在 writable._write()、writable._writev() 和 writable._final() 方法的处理期间发生的错误必须通过调用回调并将错误作为第一个参数传入来冒泡。 从这些方法中抛出 Error 或手动触发 'error' 事件会导致未定义的行为。

如果 Readable 流通过管道传送到 Writable 流时 Writable 触发了错误，则 Readable 流将会被取消管道。

```js
const { Writable } = require('stream');

const myWritable = new Writable({
  write(chunk, encoding, callback) {
    if (chunk.toString().indexOf('a') >= 0) {
      callback(new Error('数据块是无效的'));
    } else {
      callback();
    }
  }
});
```

#### 可写流的例子

以下举例了一个相当简单（并且有点无意义）的自定义的 Writable 流的实现。 虽然这个特定的 Writable 流的实例没有任何实际的特殊用途，但该示例说明了一个自定义的 Writable 流实例的每个必需元素：

```js
const { Writable } = require('stream');

class MyWritable extends Writable {
  _write(chunk, encoding, callback) {
    if (chunk.toString().indexOf('a') >= 0) {
      callback(new Error('数据块是无效的'));
    } else {
      callback();
    }
  }
}
```

#### 在可写流中解码 buffer

解码 buffer 是一个常见的任务，例如使用转换流处理字符串输入。 当使用多字节的字符编码（比如 UTF-8）时，这是一个重要的处理。 下面的例子展示了如何使用 StringDecoder 和 Writable 解码多字节的字符串。

```js
const { Writable } = require('stream');
const { StringDecoder } = require('string_decoder');

class StringWritable extends Writable {
  constructor(options) {
    super(options);
    this._decoder = new StringDecoder(options && options.defaultEncoding);
    this.data = '';
  }
  _write(chunk, encoding, callback) {
    if (encoding === 'buffer') {
      chunk = this._decoder.write(chunk);
    }
    this.data += chunk;
    callback();
  }
  _final(callback) {
    this.data += this._decoder.end();
    callback();
  }
}

const euro = [[0xE2, 0x82], [0xAC]].map(Buffer.from);
const w = new StringWritable();

w.write('货币: ');
w.write(euro[0]);
w.end(euro[1]);

console.log(w.data); // 货币: €
```

### 实现可读流

stream.Readable 类可用于实现可读流。

自定义的可读流必须调用 new stream.Readable([options]) 构造函数并实现 readable._read() 方法。

#### new stream.Readable([options])

* options <Object>
    * highWaterMark <number> 从底层资源读取数据并存储在内部缓冲区中的最大字节数。 默认值: 16384 (16kb), 对象模式的流默认为 16。
    * encoding <string> 如果指定了，则使用指定的字符编码将 buffer 解码成字符串。 默认值: null。
    * objectMode <boolean> 流是否可以是一个对象流。 也就是说 stream.read(n) 会返回对象而不是 Buffer。 默认值: false。
    * emitClose <boolean> 流被销毁后是否应该触发 'close'。默认值: true。
    * read <Function> 对 stream._read() 方法的实现。
    * destroy <Function> 对 stream._destroy() 方法的实现。
    * autoDestroy <boolean> 流是否应在结束后自动调用 .destroy()。默认值: false。

```js
const { Readable } = require('stream');

class MyReadable extends Readable {
  constructor(options) {
    // 调用 stream.Readable(options) 构造函数。
    super(options);
    // ...
  }
}
```

使用 ES6 之前的语法：

```js
const { Readable } = require('stream');
const util = require('util');

function MyReadable(options) {
  if (!(this instanceof MyReadable))
    return new MyReadable(options);
  Readable.call(this, options);
}
util.inherits(MyReadable, Readable);
```

使用简化的构造函数：

```js
const { Readable } = require('stream');

const myReadable = new Readable({
  read(size) {
    // ...
  }
});
```

#### readable._read(size)

* size <number> 要异步读取的字节数。

该函数不能被应用程序代码直接调用。 它应该由子类实现，且只能被内部的 Readable 类的方法调用。

所有可读流的实现必须提供 readable._read() 方法从底层资源获取数据。

当 readable._read() 被调用时，如果从资源读取到数据，则需要开始使用 this.push(dataChunk) 推送数据到读取队列。 _read() 应该持续从资源读取数据并推送数据，直到 readable.push() 返回 false。 若想再次调用 _read() 方法，则需要恢复推送数据到队列。

一旦 readable._read() 方法被调用，将不会再次调用它，直到更多数据通过 readable.push() 方法被推送。 空的数据（例如空的 buffer 和字符串）将不会导致 readable._read() 被调用。

size 是可选的参数。 对于读取是一个单一操作的实现，可以使用 size 参数来决定要读取多少数据。 对于其他的实现，可以忽略这个参数，只要有数据就提供数据。 不需要等待指定 size 字节的数据在调用 stream.push(chunk)。

readable._read() 方法有下划线前缀，因为它是在定义在类的内部，不应该被用户程序直接调用。

#### readable._destroy(err, callback)

* err <Error> 可能发生的错误。
* callback <Function> 回调函数。

_destroy() 方法会被 readable.destroy() 调用。 它可以被子类重写，但不能直接调用。

#### readable.push(chunk[, encoding])

* chunk <Buffer> | <Uint8Array> | <string> | <null> | <any> 要推入读取队列的数据块。  对于非对象模式的流， chunk 必须是字符串、 Buffer 或 Uint8Array。  对于对象模式的流， chunk 可以是任何 JavaScript 值。
* encoding <string> 字符串数据块的字符编码。 必须是有效的 Buffer 字符编码，例如 'utf8' 或 'ascii'。
* 返回: <boolean> 如果还有数据块可以继续推入，则返回 true，否则返回 false。

当 chunk 是 Buffer、 Uint8Array 或 string 时， chunk 的数据会被添加到内部队列中供流消费。 在没有数据可写入后，给 chunk 传入 null 表示流的结束（EOF）。

当可读流处在暂停模式时，使用 readable.push() 添加的数据可以在触发 'readable' 事件时通过调用 readable.read() 读取。

当可读流处于流动模式时，使用 readable.push() 添加的数据可以通过触发 'data' 事件读取。

readable.push() 方法被设计得尽可能的灵活。 例如，当需要封装一个带有'暂停/继续'机制与数据回调的底层数据源时，该底层数据源可以使用自定义的可读流实例封装：

```js
// `source` 是一个有 `readStop()` 和 `readStart()` 方法的对象，
// 当有数据时会调用 `ondata` 方法，
// 当数据结束时会调用 `onend` 方法。

class SourceWrapper extends Readable {
  constructor(options) {
    super(options);

    this._source = getLowLevelSourceObject();

    // 每当有数据时，将其推入内部缓冲。
    this._source.ondata = (chunk) => {
      // 如果 push() 返回 `false`，则停止读取。
      if (!this.push(chunk))
        this._source.readStop();
    };

    // 当读取到尽头时，推入 `null` 表示流的结束。
    this._source.onend = () => {
      this.push(null);
    };
  }
  // 当流想推送更多数据时， `_read` 会被调用。
  _read(size) {
    this._source.readStart();
  }
}
```

readable.push() 方法用于将内容推入内部的 buffer。 它可以由 readable._read() 方法驱动。

对于非对象模式的流，如果 readable.push() 的 chunk 参数为 undefined，则它会被当成空字符串或 buffer。 详见 readable.push('')。

#### 读取时的异常处理

在 readable._read() 执行期间发生的错误必须通过 readable.destroy(err) 方法冒泡。 从 readable._read() 中抛出 Error 或手动触发 'error' 事件会导致未定义的行为。

```js
const { Readable } = require('stream');

const myReadable = new Readable({
  read(size) {
    const err = checkSomeErrorCondition();
    if (err) {
      this.destroy(err);
    } else {
      // 做些处理。
    }
  }
});
```

#### 可读流的例子

下面是一个可读流的简单例子，依次触发读取 1 到 1,000,000：

```js
const { Readable } = require('stream');

class Counter extends Readable {
  constructor(opt) {
    super(opt);
    this._max = 1000000;
    this._index = 1;
  }

  _read() {
    const i = this._index++;
    if (i > this._max)
      this.push(null);
    else {
      const str = String(i);
      const buf = Buffer.from(str, 'ascii');
      this.push(buf);
    }
  }
}
```

### 实现双工流

双工流同时实现了可读流和可写流，例如 TCP socket 连接。

因为 JavaScript 不支持多重继承，所以使用 stream.Duplex 类实现双工流（而不是使用 stream.Readable 类和 stream.Writable 类）。

stream.Duplex 类的原型继承自 stream.Readable 和寄生自 stream.Writable，但是 instanceof 对这两个基础类都可用，因为重写了 stream.Writable 的 Symbol.hasInstance。

自定义的双工流必须调用 new stream.Duplex([options]) 构造函数并实现 readable._read() 和 writable._write() 方法。

#### new stream.Duplex(options)

* options <Object> 同时传给 Writable 和 Readable 的构造函数。
  * allowHalfOpen <boolean> 如果设为 false，则当可读端结束时，可写端也会自动结束。 默认为 true。
  * readableObjectMode <boolean> 设置流的可读端为 objectMode。 如果 objectMode 为 true，则不起作用。 默认为 false。
  * writableObjectMode <boolean> 设置流的可写端为 objectMode。 如果 objectMode 为 true，则不起作用。 默认为 false。
  * readableHighWaterMark <number> 设置流的可读端的 highWaterMark。 如果已经设置了 highWaterMark，则不起作用。
  * writableHighWaterMark <number> 设置流的可写端的 highWaterMark。 如果已经设置了 highWaterMark，则不起作用。

```js
const { Duplex } = require('stream');

class MyDuplex extends Duplex {
  constructor(options) {
    super(options);
    // ...
  }
}
```

使用 ES6 之前的语法：

```js
const { Duplex } = require('stream');
const util = require('util');

function MyDuplex(options) {
  if (!(this instanceof MyDuplex))
    return new MyDuplex(options);
  Duplex.call(this, options);
}
util.inherits(MyDuplex, Duplex);
```

使用简化的构造函数：

```js
const { Duplex } = require('stream');

const myDuplex = new Duplex({
  read(size) {
    // ...
  },
  write(chunk, encoding, callback) {
    // ...
  }
});
```

#### 双工流的例子

下面举例说明了一个双工流的简单示例，它封装了一个可以写入数据的假设的底层源对象，并且可以从中读取数据，尽管使用的是与 Node.js 流不兼容的 API。 下面举例了一个双工流的简单示例，它通过可读流接口读回可写流接口的 buffer 传入的写入数据。

```js
const { Duplex } = require('stream');
const kSource = Symbol('source');

class MyDuplex extends Duplex {
  constructor(source, options) {
    super(options);
    this[kSource] = source;
  }

  _write(chunk, encoding, callback) {
    // 底层资源只处理字符串。
    if (Buffer.isBuffer(chunk))
      chunk = chunk.toString();
    this[kSource].writeSomeData(chunk);
    callback();
  }

  _read(size) {
    this[kSource].fetchSomeData(size, (data, encoding) => {
      this.push(Buffer.from(data, encoding));
    });
  }
}
```

双工流最重要的方面是，可读端和可写端相互独立于彼此地共存在同一个对象实例中。

#### 对象模式的双工流

对双工流来说，可以使用 readableObjectMode 和 writableObjectMode 选项来分别设置可读端和可写端的 objectMode。

在下面的例子中，创建了一个变换流（双工流的一种），对象模式的可写端接收 JavaScript 数值，并在可读端转换为十六进制字符串。

```js
const { Transform } = require('stream');

// 转换流也是双工流。
const myTransform = new Transform({
  writableObjectMode: true,

  transform(chunk, encoding, callback) {
    // 强制把 chunk 转换成数值。
    chunk |= 0;

    // 将 chunk 转换成十六进制。
    const data = chunk.toString(16);

    // 推送数据到可读队列。
    callback(null, '0'.repeat(data.length % 2) + data);
  }
});

myTransform.setEncoding('ascii');
myTransform.on('data', (chunk) => console.log(chunk));

myTransform.write(1);
// 打印: 01
myTransform.write(10);
// 打印: 0a
myTransform.write(100);
// 打印: 64
```

### 实现转换流

转换流是一种双工流，它会对输入做些计算然后输出。 例如 zlib 流和 crypto 流会压缩、加密或解密数据。

输出流的大小、数据块的数量都不一定会和输入流的一致。 例如， Hash 流在输入结束时只会输出一个数据块，而 zlib 流的输出可能比输入大很多或小很多。

stream.Transform 类可用于实现了一个转换流。

stream.Transform 类继承自 stream.Duplex，并且实现了自有的 writable._write() 和 readable._read() 方法。 自定义的转换流必须实现 transform._transform() 方法，transform._flush() 方法是可选的。

当使用转换流时，如果可读端的输出没有被消费，则写入流的数据可能会导致可写端被暂停。

#### new stream.Transform([options])

* options <Object> 同时传给 Writable 和 Readable 的构造函数。
  * transform <Function> 对 stream._transform() 的实现。
  * flush <Function> 对 stream._flush() 的实现。

```js
const { Transform } = require('stream');

class MyTransform extends Transform {
  constructor(options) {
    super(options);
    // ...
  }
}
```

使用 ES6 之前的语法：

```js
const { Transform } = require('stream');
const util = require('util');

function MyTransform(options) {
  if (!(this instanceof MyTransform))
    return new MyTransform(options);
  Transform.call(this, options);
}
util.inherits(MyTransform, Transform);
```

使用简化的构造函数：

```js
const { Transform } = require('stream');

const myTransform = new Transform({
  transform(chunk, encoding, callback) {
    // ...
  }
});
```

#### 'finish' 与 'end' 事件

'finish' 事件来自 stream.Writable 类，'end' 事件来自 stream.Readable 类。 当调用了 stream.end() 并且 stream._transform() 处理完全部数据块之后，触发 'finish' 事件。 当调用了 transform._flush() 中的回调函数并且所有数据已经输出之后，触发 'end' 事件。

#### transform._flush(callback)

* callback <Function> 当剩余的数据被 flush 后的回调函数。

该函数不能被应用程序代码直接调用。 它应该由子类实现，且只能被内部的 Readable 类的方法调用。

某些情况下，转换操作可能需要在流的末尾发送一些额外的数据。 例如， zlib 压缩流时会储存一些用于优化输出的内部状态。 当流结束时，这些额外的数据需要被 flush 才算完成压缩。

自定义的转换流的 transform._flush() 方法是可选的。 当没有更多数据要被消费时，就会调用这个方法，但如果是在 'end' 事件被触发之前调用则会发出可读流结束的信号。

在 transform._flush() 的实现中， readable.push() 可能会被调用零次或多次。 当 flush 操作完成时，必须调用 callback 函数。

transform._flush() 方法有下划线前缀，因为它是在定义在类的内部，不应该被用户程序直接调用。

#### transform._transform(chunk, encoding, callback)

* chunk <Buffer> | <string> | <any> 要转换的 Buffer，从传给 stream.write() 的 string 转换而来。 如果流的 decodeStrings 选项为 false 或者流在对象模式下运行，则数据块将不会被转换，并且将是传给 stream.write() 的任何内容。
* encoding <string> 如果数据块是一个字符串，则这是编码类型。 如果数据块是一个 buffer，则为特殊值 'buffer'。在这种情况下忽略它。
* callback <Function> 当 chunk 处理完成时的回调函数。

该函数不能被应用程序代码直接调用。 它应该由子类实现，且只能被内部的 Readable 类的方法调用。

所有转换流的实现都必须提供 _transform() 方法来接收输入并生产输出。 transform._transform() 的实现会处理写入的字节，进行一些计算操作，然后使用 readable.push() 输出到可读流。

transform.push() 可能会被调用零次或多次用来从每次输入的数据块产生输出，调用的次数取决需要多少数据来产生输出的结果。

输入的数据块有可能不会产生任何输出。

当前数据被完全消费之后，必须调用 callback 函数。 当处理输入的过程中发生出错时， callback 的第一个参数传入 Error 对象，否则传入 null。 如果 callback 传入了第二个参数，则它会被转发到 readable.push()。 就像下面的例子：

```js
transform.prototype._transform = function(data, encoding, callback) {
  this.push(data);
  callback();
};

transform.prototype._transform = function(data, encoding, callback) {
  callback(null, data);
};
```

transform._transform() 方法有下划线前缀，因为它是在定义在类的内部，不应该被用户程序直接调用。

transform._transform() 不能并行调用。 流使用了队列机制，无论同步或异步的情况下，都必须先调用 callback 之后才能接收下一个数据块。

#### stream.PassThrough 类

stream.PassThrough 类是一个无关紧要的转换流，只是单纯地把输入的字节原封不动地输出。 它主要用于示例或测试，但有时也会用于某些新颖的流的基本组成部分。

## 其他注意事项

### 流与异步生成器和异步迭代器的兼容性

借助 JavaScript 中异步生成器和迭代器的支持，异步生成器实际上是此时的一流语言级流构造。

下面提供了使用带有异步生成器和异步迭代器的 Node.js 流的一些常见互操作情况。

#### 使用异步迭代器消费可读流

```js
(async function() {
  for await (const chunk of readable) {
    console.log(chunk);
  }
})();
```

异步迭代器在流上注册一个永久的错误处理程序，以防止任何未处理的 post-destroy 错误。

#### 使用异步生成器创建可读流

我们可以使用 Readable.from() 实用方法从异步生成器构造 Node.js 可读流：

```js
const { Readable } = require('stream');

async function * generate() {
  yield 'a';
  yield 'b';
  yield 'c';
}

const readable = Readable.from(generate());

readable.on('data', (chunk) => {
  console.log(chunk);
});
```

#### 从异步迭代器传送到可写流

在从异步迭代器写入可写流的场景中，应确保正确地处理背压和错误。

```js
const { once } = require('events');
const finished = util.promisify(stream.finished);

const writable = fs.createWriteStream('./file');

(async function() {
  for await (const chunk of iterator) {
    // 处理 write() 上的背压。
    if (!writable.write(chunk))
      await once(writable, 'drain');
  }
  writable.end();
  // 确保完成没有错误。
  await finished(writable);
})();
```

在上面的示例中， once() 监听器会为 'drain' 事件捕获并抛出 write() 上的错误，因为 once() 也会处理 'error' 事件。 为了确保写入流的完成且没有错误，使用上面的 finished() 方法比使用 'finish' 事件的 once() 监听器更为安全。 在某些情况下， 'finish' 之后可写流可能会触发 'error' 事件，并且 once() 将会在处理 'finish' 事件时释放 'error' 处理程序，这可能导致未处理的错误。

另外，可读流可以用 Readable.from() 封装，然后通过 .pipe() 传送：

```js
const finished = util.promisify(stream.finished);

const writable = fs.createWriteStream('./file');

(async function() {
  const readable = Readable.from(iterator);
  readable.pipe(writable);
  // 确保完成没有错误。
  await finished(writable);
})();
```

或者，使用 stream.pipeline() 传送流：

```js
const pipeline = util.promisify(stream.pipeline);

const writable = fs.createWriteStream('./file');

(async function() {
  const readable = Readable.from(iterator);
  await pipeline(readable, writable);
})();
```

### 兼容旧版本的 Node.js

Prior to Node.js 0.10, the Readable stream interface was simpler, but also less powerful and less useful.
* Rather than waiting for calls to the stream.read() method, 'data' events would begin emitting immediately. Applications that would need to perform some amount of work to decide how to handle data were required to store read data into buffers so the data would not be lost.
* The stream.pause() method was advisory, rather than guaranteed. This meant that it was still necessary to be prepared to receive 'data' events even when the stream was in a paused state.

In Node.js 0.10, the Readable class was added. For backward compatibility with older Node.js programs, Readable streams switch into "flowing mode" when a 'data' event handler is added, or when the stream.resume() method is called. The effect is that, even when not using the new stream.read() method and 'readable' event, it is no longer necessary to worry about losing 'data' chunks.

While most applications will continue to function normally, this introduces an edge case in the following conditions:

* No 'data' event listener is added.
* The stream.resume() method is never called.
* The stream is not piped to any writable destination.

For example, consider the following code:

```js
// WARNING!  BROKEN!
net.createServer((socket) => {

  // We add an 'end' listener, but never consume the data.
  socket.on('end', () => {
    // It will never get here.
    socket.end('The message was received but was not processed.\n');
  });

}).listen(1337);
```

Prior to Node.js 0.10, the incoming message data would be simply discarded. However, in Node.js 0.10 and beyond, the socket remains paused forever.

The workaround in this situation is to call the stream.resume() method to begin the flow of data:

```js
// Workaround.
net.createServer((socket) => {
  socket.on('end', () => {
    socket.end('The message was received but was not processed.\n');
  });

  // Start the flow of data, discarding it.
  socket.resume();
}).listen(1337);
```

In addition to new Readable streams switching into flowing mode, pre-0.10 style streams can be wrapped in a Readable class using the readable.wrap() method.

### readable.read(0)

在某些情况下，需要触发底层可读流的刷新，但实际并不消费任何数据。 在这种情况下，可以调用 readable.read(0)，返回 null。

如果内部读取缓冲小于 highWaterMark，且流还未被读取，则调用 stream.read(0) 会触发调用底层的 stream._read()。

虽然大多数应用程序几乎不需要这样做，但 Node.js 中会出现这种情况，尤其是在可读流类的内部。

### readable.push('')

不推荐使用 readable.push('')。

向一个非对象模式的流推入一个零字节的字符串、 Buffer 或 Uint8Array 会产生副作用。 因为调用了 readable.push()，该调用会结束读取进程。 然而，因为参数是一个空字符串，没有数据被添加到可读缓冲, 所以也就没有数据可供用户消费。

### 调用 `readable.setEncoding()` 之后 `highWaterMark` 的差异

使用 readable.setEncoding() 会改变 highWaterMark 属性在非对象模式中的作用。

一般而言，当前缓冲的大小是以字节为单位跟 highWaterMark 比较的。 但是调用 setEncoding() 之后，会开始以字符为单位进行比较。

大多数情况下，使用 latin1 或 ascii 时是没有问题的。 但在处理含有多字节字符的字符串时，需要小心。


