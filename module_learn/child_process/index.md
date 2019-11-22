# child_process 子进程

[本部分文档](http://nodejs.cn/api/child_process.html)

child_process模块提供了衍生子进程的能力（以一种与popen(3)类似但不相同的方式）。此功能主要由child_process.spawn()函数提供：

```js
const {spawn} = require('child_process');
const ls = spawn('ls', ['-lh', '/usr']);
ls.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});
ls.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});
ls.on('close', (code) => {
    console.log(`子进程退出，使用退出码 ${code}`);
});
```

默认情况下，stdin、stdout和stderr的管道会在父Node.js进程和衍生的子进程之间建立。这些管道具有有限的（且平台特定的）容量。如果子进程写入stdout时超出该限制且没有捕获输出，则子进程将会阻塞并等待管道缓冲区接受更多的数据。这与shell中的管道的行为相同。如果不消费输出，则使用{stdio: 'ignore'}选项。
child_process.spawn()方法异步地衍生子进程，且不阻塞Node.js事件循环。child_process.spawnSync()函数则以同步的方式提供了等效的功能，但会阻塞事件循环直到衍生的进程退出或终止。
为方便起见，child_process模块提供了child_process.spawn()和child_process.spawnSync()的一些同步和异步的替代方法。这些替代方法中的每一个都是基于child_process.spawn()或child_rocess.spawnSync()实现的。

* child_process.exec(): 衍生一个shell并在该shell中运行命令，当完成时则将stdout和stderr传给回调函数。
* child_process.execFile(): 类似于child_process.exec()，但是默认情况下它会直接衍生命令而不显衍生shell。
* child_process.fork(): 衍生一个新的Node.js进程，并调用一个指定的模块，该模块已建立了IPC通信通道，允许在父进程与子进程之间发送消息。
* child_process.execSync(): child_process.exec()的同步版本，将会阻塞Node.js事件循环。
* child_process.execFileSync(): child_process.execFile()的同步版本，将会阻塞Node.js事件循环。

对于某些用例，例如自动化的shell脚本，同步的方法可能更方便。但是在大多数情况下，同步的方法会对性能产生重大的影响，因为会暂停事件循环直到衍生的进程完成。

## 创建异步的进程

child_process.spawn()、child_process.fork()、child_process.exec()和child_process.execFile()方法都遵循其他Node.js API惯用的异步编程模式。
每个方法都返回一个ChildProcess实例。这些对象实现了Node.js的EventEmitter API，允许父进程注册监听器函数，在子进程的生命周期中当发生某些事件时会被调用。
child_process.exec()和child_process.execFile()方法还允许指定可选的callback函数，当子进程终止时会被调用。

### 在windows上衍生.bat和.cmd文件

child_process.exec()和child_process.execFile()之间区别的重要性可能因平台而异。在Unix类型的操作系统（Unix、Linux、macOS）上，child_process.execFile()可以更高效，因为默认情况下它不会衍生shell。但是在windows上，.bat和.cmd文件在没有终端的情况下不能自行执行，因此无法使用child_process.execFile()启动。当在windows上运行时，要调用.bat和.cmd文件，可以使用设置了shell选项的child_process.spawn()、或child_process.exec()、或衍生cmd.exe并将.bat或.cmd文件作为参数传入（也就是shell选项和child_process.exec()所做的）。在任何情况下，如果脚本的文件名包含空格，则需要加上引号。

```js
// 仅在windows上
const {spawn} = require('child_process');
const bat = spawn('cmd.exe', ['/c', 'my.bat']);
bat.stdout.on('data', (data) => {
    console.log(data.toString());
});
bat.stderr.on('data', (data) => {
    console.error(data.toString());
});
bat.on('exit', (code) => {
    console.log(`子进程退出，退出码 ${code}`);
});
```

```js
// 或
const {exec, spawn} = require('child_process');
exec('my.bat', (err, stdout, stderr) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log(stdout);
});
// 文件名中包含空格的脚本
const bat = spawn('"my script.cmd"', ['a', 'b'], {shell: true});
// 或
exec('"my script.cmd" a b', (err, stdout, stderr) => {
    // ...
});
```

### child_process.exec(command[, options][, callback])

* command <string> 要运行的命令，并带上以空格分隔的参数。
* options <Object>
    * cwd <string> 子进程的当前工作目录。默认值: null。
    * env <Object> 环境变量的键值对。默认值: process.env。
    * encoding <string> 默认值: 'utf8'。
    * shell <string> 用于执行命令的 shell。参阅 shell 的要求与 Windows 默认的 shell。 默认值: Unix 上是 '/bin/sh'，Windows 上是 process.env.ComSpec。
    * timeout <number> 默认值: 0。
    * maxBuffer <number> stdout 或 stderr 上允许的最大字节数。如果超过限制，则子进程会被终止并且截断任何输出。参阅 maxBuffer 与 Unicode 中的警告。默认值: 1024 * 1024。
    * killSignal <string> | <integer> 默认值: 'SIGTERM'。
    * uid <number> 设置进程的用户标识，参阅 setuid(2)。
    * gid <number> 设置进程的群组标识，参阅 setgid(2)。
    * windowsHide <boolean> 隐藏子进程的控制台窗口（在 Windows 系统上通常会创建）。）。默认值: false。
* callback <Function> 当进程终止时调用并带上输出。
    * error <Error>
    * stdout <string> | <Buffer>
    * stderr <string> | <Buffer>
* 返回: <ChildProcess>

衍生一个 shell 然后在该 shell 中执行 command，并缓冲任何产生的输出。 传给 exec 函数的 command 字符串由 shell 直接处理，特殊字符（因 shell 而异）需要相应地处理：

```js
exec('"/path/to/test file/test.sh" arg1 arg2');
// 使用双引号，以便路径中的空格不被解析为多个参数的分隔符。
exec('echo "The \\$HOME variable is $HOME"');
// 第一个 $HOME 变量会被转义，第二个则不会。
```

切勿将未经过处理的用户输入传给此函数。 包含 shell 元字符的任何输入都可用于触发任意命令的执行。

如果提供了 callback，则调用时传入参数 (error, stdout, stderr)。 当成功时，则 error 将会为 null。 当出错时，则 error 将会是 Error 的实例。 error.code 属性将会是子进程的退出码， error.signal 将会被设为终止进程的信号。 除 0 以外的任何退出码都被视为出错。

传给回调的 stdout 和 stderr 参数将会包含子进程的 stdout 和 stderr 输出。 默认情况下，Node.js 会将输出解码为 UTF-8 并将字符串传给回调。 encoding 选项可用于指定用于解码 stdout 和 stderr 输出的字符编码。 如果 encoding 是 'buffer' 或无法识别的字符编码，则传给回调的将会是 Buffer 对象。

```js
const { exec } = require('child_process');
exec('cat *.js missing_file | wc -l', (error, stdout, stderr) => {
    if (error) {
        console.error(`执行的错误: ${error}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
});
```

如果 timeout 大于 0，则当子进程运行时间超过 timeout 毫秒时，父进程将会发送带 killSignal 属性（默认为 'SIGTERM'）的信号。

与 exec(3) 的 POSIX 系统调用不同， child_process.exec() 不会替换现有的进程，且使用 shell 来执行命令。

如果调用此方法的 util.promisify() 版本，则返回的 Promise 会返回具有 stdout 属性和 stderr 属性的 Object。 返回的 ChildProcess 实例会作为 child 属性附加到该 Promise。 如果出现错误（包括导致退出码不是 0 的任何错误），则返回被拒绝的 Promise，并带上与回调中相同的 error 对象，但是还有两个另外的属性 stdout 和 stderr。

```js
const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function lsExample() {
    const { stdout, stderr } = await exec('ls');
    console.log('stdout:', stdout);
    console.error('stderr:', stderr);
}
lsExample();
```

### child_process.execFile(file[, args][, options][, callback])

* file <string> 要运行的可执行文件的名称或路径。
* args <string[]> 字符串参数的列表。
* options <Object>
    * cwd <string> 子进程的当前工作目录。
    * env <Object> 环境变量的键值对。默认值: process.env。
    * encoding <string> 字符编码。默认值: 'utf8'。
    * timeout <number> 默认值: 0。
    * maxBuffer <number> stdout 或 stderr 上允许的最大字节数。如果超过限制，则子进程会被终止并且截断任何输出。参阅 maxBuffer 与 Unicode 中的警告。默认值: 1024 * 1024。
    * killSignal <string> | <integer> 默认值: 'SIGTERM'。
    * uid <number> 设置进程的用户标识，参阅 setuid(2)。
    * gid <number> 设置进程的群组标识，参阅 setgid(2)。
    * windowsHide <boolean> 隐藏子进程的控制台窗口（在 Windows 系统上通常会创建）。默认值: false。
    * windowsVerbatimArguments <boolean> 在 Windows 上不为参数加上引号或转义。在 Unix 上忽略。默认值: false。
    * shell <boolean> | <string> 如果为 true，则在 shell 中运行 command。 在 Unix 上使用 '/bin/sh'，在 Windows 上使用 process.env.ComSpec。 可以将不同的 shell 指定为字符串。 参阅 shell 的要求与 Windows 默认的 shell。 默认值: false（没有 shell）。
* callback <Function> 当进程终止时调用并带上输出。
    * error <Error>
    * stdout <string> | <Buffer>
    * stderr <string> | <Buffer>
* 返回: <ChildProcess>

child_process.execFile() 函数类似于 child_process.exec()，但默认情况下不会衍生 shell。 相反，指定的可执行文件 file 会作为新进程直接地衍生，使其比 child_process.exec() 稍微更高效。

支持与 child_process.exec() 相同的选项。 由于没有衍生 shell，因此不支持 I/O 重定向和文件通配等行为。

```js
const { execFile } = require('child_process');
const child = execFile('node', ['--version'], (error, stdout, stderr) => {
    if (error) {
        throw error;
    }
    console.log(stdout);
});
```

传给回调的 stdout 和 stderr 参数将会包含子进程的 stdout 和 stderr 输出。 默认情况下，Node.js 会将输出解码为 UTF-8 并将字符串传给回调。 encoding 选项可用于指定用于解码 stdout 和 stderr 输出的字符编码。 如果 encoding 是 'buffer' 或无法识别的字符编码，则传给回调的将会是 Buffer 对象。

如果调用此方法的 util.promisify() 版本，则返回的 Promise 会返回具有 stdout 属性和 stderr 属性的 Object。 返回的 ChildProcess 实例会作为 child 属性附加到该 Promise。 如果出现错误（包括导致退出码不是 0 的任何错误），则返回被拒绝的 Promise，并带上与回调中相同的 error 对象，但是还有两个另外的属性 stdout 和 stderr。

```js
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
async function getVersion() {
    const { stdout } = await execFile('node', ['--version']);
    console.log(stdout);
}
getVersion();
```

如果启用了 shell 选项，则不要将未经过处理的用户输入传给此函数。 包含 shell 元字符的任何输入都可用于触发任意命令的执行。

### child_process.fork(modulePath[, args][, options])

* modulePath <string> 要在子进程中运行的模块。
* args <string[]> 字符串参数的列表。
* options <Object>
    * cwd <string> 子进程的当前工作目录。
    * detached <boolean> 准备子进程独立于其父进程运行。具体行为取决于平台，参阅 options.detached。
    * env <Object> 环境变量的键值对。默认值: process.env。
    * execPath <string> 用于创建子进程的可执行文件。
    * execArgv <string[]> 传给可执行文件的字符串参数的列表。默认值: process.execArgv。
    * silent <boolean> 如果为 true，则子进程的 stdin、stdout 和 stderr 将会被输送到父进程，否则它们将会继承自父进程，详见 child_process.spawn() 的 stdio 中的 'pipe' 和 'inherit' 选项。默认值: false。
    * stdio <Array> | <string> 参阅 child_process.spawn() 的 stdio。当提供此选项时，则它覆盖 silent 选项。如果使用了数组变量，则它必须包含一个值为 'ipc' 的元素，否则将会抛出错误。例如 [0, 1, 2, 'ipc']。
    * windowsVerbatimArguments <boolean> 在 Windows 上不为参数加上引号或转义。在 Unix 上则忽略。默认值: false。
    * uid <number> 设置进程的用户标识，参阅 setuid(2)。
    * gid <number> 设置进程的群组标识，参阅 setgid(2)。
* 返回: <ChildProcess>

child_process.fork() 方法是 child_process.spawn() 的一个特例，专门用于衍生新的 Node.js 进程。 与 child_process.spawn() 一样返回 ChildProcess 对象。 返回的 ChildProcess 将会内置一个额外的通信通道，允许消息在父进程和子进程之间来回传递。 详见 subprocess.send()。

记住，衍生的 Node.js 子进程独立于父进程，但两者之间建立的 IPC 通信通道除外。 每个进程都有自己的内存，带有自己的 V8 实例。 由于需要额外的资源分配，因此不建议衍生大量的 Node.js 子进程。

默认情况下， child_process.fork() 将会使用父进程的 process.execPath 来衍生新的 Node.js 实例。 options 对象中的 execPath 属性允许使用其他的执行路径。

使用自定义的 execPath 启动的 Node.js 进程将会使用文件描述符（在子进程上使用环境变量 NODE_CHANNEL_FD 标识）与父进程通信。

与 fork(2) 的 POSIX 系统调用不同， child_process.fork() 不会克隆当前的进程。

child_process.spawn() 中可用的 shell 选项在 child_process.fork() 中不支持，如果设置则将会被忽略。

### child_process.spawn(command[, args][, options])

* command <string> 要运行的命令。
* args <string[]> 字符串参数的列表。
* options <Object>
    * cwd <string> 子进程的当前工作目录。
    * env <Object> 环境变量的键值对。默认值: process.env。
    * argv0 <string> 显式地设置发送给子进程的 argv[0] 的值。如果没有指定，则将会被设置为 command 的值。
    * stdio <Array> | <string> 子进程的 stdio 配置。参阅 options.stdio。
    * detached <boolean> 准备子进程独立于其父进程运行。具体行为取决于平台，参阅 options.detached。
    * uid <number> 设置进程的用户标识，参阅 setuid(2)。
    * gid <number> 设置进程的群组标识，参阅 setgid(2)。
    * shell <boolean> | <string> 如果为 true，则在 shell 中运行 command。 在 Unix 上使用 '/bin/sh'，在 Windows 上使用 process.env.ComSpec。 可以将不同的 shell 指定为字符串。 参阅 shell 的要求与 Windows 默认的 shell。 默认值: false（没有 shell）。
    * windowsVerbatimArguments <boolean> 在 Windows 上不为参数加上引号或转义。在 Unix 上忽略。如果指定了 shell 并且是 CMD，则自动设为 true。默认值: false。
    * windowsHide <boolean> 隐藏子进程的控制台窗口（在 Windows 系统上通常会创建）。默认值: false。
* 返回: <ChildProcess>

child_process.spawn() 方法使用给定的 command 衍生一个新进程，并带上 args 中的命令行参数。 如果省略 args，则其默认为一个空数组。

如果启用了 shell 选项，则不要将未经过处理的用户输入传给此函数。 包含 shell 元字符的任何输入都可用于触发任意命令的执行。

第三个参数可用于指定额外的选项，具有以下默认值：

```js
const defaults = {
    cwd: undefined,
    env: process.env
};
```

使用 cwd 指定衍生进程的工作目录。 如果没有给定，则默认为继承当前工作目录。

使用 env 指定新进程的可见的环境变量，默认为 process.env。

env 中的 undefined 值将会被忽略。

示例，运行 ls -lh /usr，并捕获 stdout、 stderr、以及退出码：

```js
const { spawn } = require('child_process');
const ls = spawn('ls', ['-lh', '/usr']);

ls.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
});

ls.on('close', (code) => {
    console.log(`子进程退出，退出码 ${code}`);
});
```

示例，一种非常精细的运行 ps ax | grep ssh 的方式：

```js
const { spawn } = require('child_process');
const ps = spawn('ps', ['ax']);
const grep = spawn('grep', ['ssh']);

ps.stdout.on('data', (data) => {
    grep.stdin.write(data);
});

ps.stderr.on('data', (data) => {
    console.error(`ps stderr: ${data}`);
});

ps.on('close', (code) => {
    if (code !== 0) {
        console.log(`ps 进程退出，退出码 ${code}`);
    }
    grep.stdin.end();
});

grep.stdout.on('data', (data) => {
    console.log(data.toString());
});

grep.stderr.on('data', (data) => {
    console.error(`grep stderr: ${data}`);
});

grep.on('close', (code) => {
    if (code !== 0) {
        console.log(`grep 进程退出，退出码 ${code}`);
    }
});
```

示例，检查失败的 spawn：

```js
const { spawn } = require('child_process');
const subprocess = spawn('bad_command');

subprocess.on('error', (err) => {
    console.error('启动子进程失败');
});
```

某些平台（macOS、Linux）使用 argv[0] 的值作为进程的标题，其他平台（Windows、SunOS）则使用 command。

Node.js 在启动时会使用 process.execPath 覆盖 argv[0]，因此 Node.js 子进程的 process.argv[0] 与从父进程传给 spawn 的 argv0 参数不会匹配，可以使用 process.argv0 属性获取。

### options.detached

在 Windows 上，设置 options.detached 为 true 可以使子进程在父进程退出后继续运行。 子进程有自己的控制台窗口。 一旦为子进程启用它，则无法被禁用。

在非 Windows 平台上，如果 options.detached 设为 true，则子进程将会成为新的进程组和会话的主导者。 子进程在父进程退出后可以继续运行，不管它们是否被分离。 详见 setsid(2)。

默认情况下，父进程将会等待被分离的子进程退出。 为了防止父进程等待 subprocess，可以使用 subprocess.unref() 方法。 这样做将会导致父进程的事件循环不会将子进程包含在其引用计数中，使得父进程可以独立于子进程退出，除非子进程和父进程之间建立了 IPC 通道。

当使用 detached 选项来启动一个长期运行的进程时，该进程在父进程退出后将不会保持在后台运行，除非提供一个不连接到父进程的 stdio 配置。 如果父进程的 stdio 是继承的，则子进程将会保持绑定到控制终端。

示例，一个长期运行的进程，为了忽视父进程的终止，通过分离且忽视其父进程的 stdio 文件描述符来实现：

```js
const { spawn } = require('child_process');

const subprocess = spawn(process.argv[0], ['child_program.js'], {
    detached: true,
    stdio: 'ignore'
});

subprocess.unref();
```

也可以将子进程的输出重定向到文件：

```js
const fs = require('fs');
const { spawn } = require('child_process');
const out = fs.openSync('./out.log', 'a');
const err = fs.openSync('./out.log', 'a');

const subprocess = spawn('prg', [], {
    detached: true,
    stdio: [ 'ignore', out, err ]
});

subprocess.unref();
```

### options.stdio

options.stdio 选项用于配置在父进程和子进程之间建立的管道。 默认情况下，子进程的 stdin、 stdout 和 stderr 会被重定向到 ChildProcess 对象上相应的 subprocess.stdin、subprocess.stdout 和 subprocess.stderr 流。 这相当于将 options.stdio 设置为 ['pipe', 'pipe', 'pipe']。

为方便起见， options.stdio 可以是以下字符串之一：

* 'pipe' - 相当于 ['pipe', 'pipe', 'pipe']（默认值）。
* 'ignore' - 相当于 ['ignore', 'ignore', 'ignore']。
* 'inherit' - 相当于 ['inherit', 'inherit', 'inherit'] 或 [0, 1, 2]。

否则， options.stdio 的值是一个数组，其中每个索引对应于子进程中的 fd。 fd 0、1 和 2 分别对应于 stdin、stdout 和 stderr。 可以指定其他 fd 以便在父进程和子进程之间创建额外的管道。 值可以是以下之一：

1. 'pipe' - 在子进程和父进程之间创建一个管道。 管道的父端作为 child_process 对象上的 subprocess.stdio[fd] 属性暴露给父进程。 为 fd 0 - 2 创建的管道也可分别作为 subprocess.stdin、subprocess.stdout 和 subprocess.stderr 使用。
2. 'ipc' - 创建一个 IPC 通道，用于在父进程和子进程之间传递消息或文件描述符。 一个 ChildProcess 最多可以有一个 IPC stdio 文件描述符。 设置此选项会启用 subprocess.send() 方法。 如果子进程是一个 Node.js 进程，则 IPC 通道的存在将会启用 process.send() 和 process.disconnect() 方法、以及子进程内的 'disconnect' 和 'message' 事件。
    以 process.send() 以外的任何方式访问 IPC 通道的 fd、或者在一个不是 Node.js 实例的子进程中使用 IPC 通道，都是不支持的。
3. 'ignore' - 指示 Node.js 忽略子进程中的 fd。 虽然 Node.js 将会始终为它衍生的进程打开 fd 0 - 2，但将 fd 设置为 'ignore' 将会导致 Node.js 打开 /dev/null 并将其附加到子进程的 fd。

4. 'inherit' - 将相应的 stdio 流传给父进程或从父进程传入。 在前三个位置中，这分别相当于 process.stdin、 process.stdout 和 process.stderr。 在任何其他位置中，则相当于 'ignore'。
5. <Stream> 对象 - 与子进程共享指向 tty、文件、 socket 或管道的可读或可写流。 流的底层文件描述符在子进程中会被复制到与 stdio 数组中的索引对应的 fd。 该流必须具有一个底层的描述符（文件流直到触发 'open' 事件才需要）。
6. 正整数 - 整数值会被解释为当前在父进程中打开的文件描述符。 它与子进程共享，类似于共享 <Stream> 对象的方式。 在 Windows 上不支持传入 socket。
7. null 或 undefined - 使用默认值。 对于 stdio 的 fd 0、1 和 2（换句话说，stdin、stdout 和 stderr），将会创建一个管道。 对于 fd 3 及更大的值，则默认为 'ignore'。

```js
const { spawn } = require('child_process');

// 子进程使用父进程的 stdio。
spawn('prg', [], { stdio: 'inherit' });

// 衍生的子进程只共享 stderr。
spawn('prg', [], { stdio: ['pipe', 'pipe', process.stderr] });

// 打开一个额外的 fd=4，与呈现启动式界面的程序进行交互。
spawn('prg', [], { stdio: ['pipe', null, null, null, 'pipe'] });
```

当在父进程和子进程之间建立 IPC 通道，并且子进程是一个 Node.js 进程时，则子进程启动时不会指向 IPC 通道（使用 unref()），直到子进程为 'disconnect' 事件或 'message' 事件注册了事件处理函数。 这允许子进程正常退出而不需要通过开放的 IPC 通道保持打开该进程。

在类 Unix 操作系统上，child_process.spawn() 方法在将事件循环与子进程解耦之前会同步地执行内存操作。 具有大内存占用的应用程序可能会发现频繁的 child_process.spawn() 调用成为瓶颈。 详见 V8 问题 7381。

还可参阅：child_process.exec() 和 child_process.fork()。

## 创建同步的进程

child_process.spawnSync()、child_process.execSync() 和 child_process.execFileSync() 方法是同步的，并且将会阻塞 Node.js 事件循环、暂停任何其他代码的执行，直到衍生的进程退出。

阻塞这些调用对于简化通用的脚本任务和简化应用程序配置在启动时的加载或处理都非常有用。

### child_process.execFileSync(file[, args][, options])

* file <string> 要运行的可执行文件的名称或路径。
* args <string[]> 字符串参数的列表。
* options <Object>
    * cwd <string> 子进程的当前工作目录。
    * input <string> | <Buffer> | <TypedArray> | <DataView> 该值将会作为 stdin 传给衍生的进程。提供此值将会覆盖 stdio[0]。
    * stdio <string> | <Array> 子进程的 stdio 配置。默认情况下，除非指定了 stdio，否则 stderr 将会被输出到父进程的 stderr。默认值: 'pipe'。
    * env <Object> 环境变量的键值对。默认值: process.env。
    * uid <number> 设置进程的用户标识，参阅 setuid(2)。
    * gid <number> 设置进程的群组标识，参阅 setgid(2)。
    * timeout <number> 允许进程运行的最长时间，以毫秒为单位。默认值: undefined。
    * killSignal <string> | <integer> 当衍生的进程将被终止时使用的信号值。默认值: 'SIGTERM'。
    * maxBuffer <number> stdout 或 stderr 上允许的最大字节数。如果超过限制，则子进程会被终止。参阅 maxBuffer 与 Unicode 中的警告。默认值: 1024 * 1024。
    * encoding <string> 用于所有 stdio 输入和输出的字符编码。默认值: 'buffer'。
    * windowsHide <boolean> 隐藏子进程的控制台窗口（在 Windows 系统上通常会创建）。默认值: false。
    * shell <boolean> | <string> 如果为 true，则在 shell 中运行 command。 在 Unix 上使用 '/bin/sh'，在 Windows 上使用 process.env.ComSpec。 可以将不同的 shell 指定为字符串。 参阅 shell 的要求与 Windows 默认的 shell。 默认值: false（没有 shell）。
* 返回: <Buffer> | <string> 命令的 stdout。

child_process.execFileSync() 方法通常与 child_process.execFile() 相同，但该方法在子进程完全关闭之前不会返回。 当遇到超时并发送 killSignal 时，该方法也需等到进程完全退出后才返回。

如果子进程拦截并处理了 SIGTERM 信号但未退出，则父进程仍将等待子进程退出。

如果进程超时或具有非零的退出码，则此方法将抛出一个 Error，其中包含底层 child_process.spawnSync() 的完整结果。

如果启用了 shell 选项，则不要将未经过处理的用户输入传给此函数。 包含 shell 元字符的任何输入都可用于触发任意命令的执行。

### child_process.execSync(command[, options])

* command <string> 要运行的命令。
* options <Object>
    * cwd <string> 子进程的当前工作目录。
    * input <string> | <Buffer> | <TypedArray> | <DataView> 该值将会作为 stdin 传给衍生的进程。提供此值将会覆盖 stdio[0]。
    * stdio <string> | <Array> 子进程的 stdio 配置。默认情况下，除非指定了 stdio，否则 stderr 将会被输出到父进程的 stderr。默认值: 'pipe'。
    * env <Object> 环境变量的键值对。默认值: process.env。
    * shell <string> 用于执行命令的 shell。参阅 shell 的要求与 Windows 默认的 shell。 默认值: Unix 上是 '/bin/sh'，Windows 上是 process.env.ComSpec。
    * uid <number> 设置进程的用户标识，参阅 setuid(2)。
    * gid <number> 设置进程的群组标识，参阅 setgid(2)。
    * timeout <number> 允许进程运行的最长时间，以毫秒为单位。默认值: undefined。
    * killSignal <string> | <integer> 当衍生的进程将被终止时使用的信号值。默认值: 'SIGTERM'。
    * maxBuffer <number> stdout 或 stderr 上允许的最大字节数。如果超过限制，则子进程会被终止并且截断任何输出。参阅 maxBuffer 与 Unicode 中的警告。默认值: 1024 * 1024。
    * encoding <string> 用于所有 stdio 输入和输出的字符编码。默认值: 'buffer'。
    * windowsHide <boolean> 隐藏子进程的控制台窗口（在 Windows 系统上通常会创建）。默认值: false。
* 返回: <Buffer> | <string> 命令的 stdout。

child_process.execSync() 方法通常与 child_process.exec() 相同，但该方法在子进程完全关闭之前不会返回。 当遇到超时并发送 killSignal 时，该方法也需等到进程完全退出后才返回。 如果子进程拦截并处理了 SIGTERM 信号但未退出，则父进程将会等待直到子进程退出。

如果进程超时或具有非零的退出码，则此方法将会抛出错误。 Error 对象将会包含 child_process.spawnSync() 的完整结果。

切勿将未经过处理的用户输入传给此函数。 包含 shell 元字符的任何输入都可用于触发任意命令的执行。

### child_process.spawnSync(command[, args][, options])

* command <string> 要运行的命令。
* args <string[]> 字符串参数的列表。
* options <Object>
    * cwd <string> 子进程的当前工作目录。
    * input <string> | <Buffer> | <TypedArray> | <DataView> 该值将会作为 stdin 传给衍生的进程。提供此值将会覆盖 stdio[0]。
    * argv0 <string> 显式地设置发送给子进程的 argv[0] 的值。如果没有指定，则将会被设置为 command 的值。
    * stdio <string> | <Array> 子进程的 stdio 配置。
    * env <Object> 环境变量的键值对。默认值: process.env。
    * uid <number> 设置进程的用户标识，参阅 setuid(2)。
    * gid <number> 设置进程的群组标识，参阅 setgid(2)。
    * timeout <number> 允许进程运行的最长时间，以毫秒为单位。默认值: undefined。
    * killSignal <string> | <integer> 当衍生的进程将被终止时使用的信号值。默认值: 'SIGTERM'。
    * maxBuffer <number> stdout 或 stderr 上允许的最大字节数。如果超过限制，则子进程会被终止并且截断任何输出。参阅 maxBuffer 与 Unicode 中的警告。默认值: 1024 * 1024。
    * encoding <string> 用于所有 stdio 输入和输出的字符编码。默认值: 'buffer'。
    * shell <boolean> | <string> 如果为 true，则在 shell 中运行 command。 在 Unix 上使用 '/bin/sh'，在 Windows 上使用 process.env.ComSpec。 可以将不同的 shell 指定为字符串。 参阅 shell 的要求与 Windows 默认的 shell。 默认值: false（没有 shell）。
    * windowsVerbatimArguments <boolean> 在 Windows 上不为参数加上引号或转义。在 Unix 上忽略。如果指定了 shell 并且是 CMD，则自动设为 true。默认值: false。
    * windowsHide <boolean> 隐藏子进程的控制台窗口（在 Windows 系统上通常会创建）。默认值: false。
* 返回: <Object>
    * pid <number> 子进程的 pid。
    * output <Array> stdio 输出的结果数组。
    * stdout <Buffer> | <string> output[1] 的内容。
    * stderr <Buffer> | <string> output[2] 的内容。
    * status <number> 子进程的退出码，如果子进程因信号而终止，则为 null。
    * signal <string> 用于杀死子进程的信号，如果子进程不是因信号而终止，则为 null。
    * error <Error> 如果子进程失败或超时的错误对象。

child_process.spawnSync() 方法通常与 child_process.spawn() 相同，但在子进程完全关闭之前该函数不会返回。 当遇到超时并发送 killSignal 时，该方法也需等到进程完全退出后才返回。 如果进程拦截并处理了 SIGTERM 信号但未退出，则父进程将会等待直到子进程退出。

如果启用了 shell 选项，则不要将未经过处理的用户输入传给此函数。 包含 shell 元字符的任何输入都可用于触发任意命令的执行。

## ChildProcess 类

* 继承自: <EventEmitter>

ChildProcess 的实例代表衍生的子进程。

ChildProcess 的实例不是直接创建的。 而是，使用 child_process.spawn()、child_process.exec()、child_process.execFile() 或 child_process.fork() 方法来创建 ChildProcess 的实例。

### close事件

* code <number> 子进程自行退出时的退出码。
* signal <string> 子进程被终止的信号。

当子进程的 stdio 流已被关闭时会触发 'close' 事件。 这与 'exit' 事件不同，因为多个进程可能共享相同的 stdio 流。

```js
const { spawn } = require('child_process');
const ls = spawn('ls', ['-lh', '/usr']);
ls.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
});
ls.on('close', (code) => {
    console.log(`子进程使用代码 ${code} 关闭所有 stdio`);
});
ls.on('exit', (code) => {
    console.log(`子进程使用代码 ${code} 退出`);
});
```

### disconnect事件

调用父进程中的 subprocess.disconnect() 或子进程中的 process.disconnect() 后会触发 'disconnect' 事件。 断开连接后就不能再发送或接收信息，且 subprocess.connected 属性为 false。

### error事件

* err <Error> 错误。

每当出现以下情况时触发 'error' 事件：

1. 无法衍生进程；
2. 无法杀死进程；
3. 向子进程发送消息失败。

发生错误后，可能会也可能不会触发 'exit' 事件。 当同时监听 'exit' 和 'error' 事件时，则需要防止意外地多次调用处理函数。

也可参阅 subprocess.kill() 和 subprocess.send()。

### exit事件

* code <number> 子进程自行退出时的退出码。
* signal <string> 子进程被终止的信号。

当子进程结束后时会触发 'exit' 事件。 如果进程退出，则 code 是进程的最终退出码，否则为 null。 如果进程是因为收到的信号而终止，则 signal 是信号的字符串名称，否则为 null。 这两个值至少有一个是非空的。

当 'exit' 事件被触发时，子进程的 stdio 流可能依然是打开的。

Node.js 为 SIGINT 和 SIGTERM 建立了信号处理程序，且 Node.js 进程收到这些信号不会立即终止。 相反，Node.js 将会执行一系列的清理操作，然后再重新提升处理后的信号。

参阅 waitpid(2)。

### message事件

* message <Object> 一个已解析的 JSON 对象或原始值。
* sendHandle <Handle> 一个 net.Socket 或 net.Server 对象，或 undefined。

当子进程使用 process.send() 发送消息时会触发 'message' 事件。

消息通过序列化和解析进行传递。 收到的消息可能跟最初发送的不完全一样。

### subprocess.channel

* <Object> 一个管道，表示子进程的 IPC 通道。

subprocess.channel 属性是对子进程的 IPC 通道的引用。 如果当前没有 IPC 通道，则此属性为 undefined。

### subprocess.connected

* <boolean> 调用 subprocess.disconnect() 后会被设为 false。

subprocess.connected 属性表明是否可以从子进程发送和接收消息。 当 subprocess.connected 为 false 时，则不能再发送或接收消息。

### subprocess.disconnect()

关闭父进程与子进程之间的 IPC 通道，一旦没有其他的连接使其保持活跃，则允许子进程正常退出。 调用该方法后，则父进程和子进程上各自的 subprocess.connected 和 process.connected 属性都会被设为 false，且进程之间不能再传递消息。

当进程中没有正被接收的消息时，就会触发 'disconnect' 事件。 这经常在调用 subprocess.disconnect() 后被立即触发。

当子进程是一个 Node.js 实例时（例如使用 child_process.fork() 衍生），也可以在子进程中调用 process.disconnect() 方法来关闭 IPC 通道。

### subprocess.kill([signal])

* signal <number> | <string>

subprocess.kill() 方法会向子进程发送一个信号。 如果没有给定参数，则进程将会发送 'SIGTERM' 信号。 参阅 signal(7) 了解可用的信号列表。

```js
const { spawn } = require('child_process');
const grep = spawn('grep', ['ssh']);

grep.on('close', (code, signal) => {
    console.log(`子进程因收到信号 ${signal} 而终止`);
});

// 发送 SIGHUP 到进程。
grep.kill('SIGHUP');
```

如果信号没有被送达，则 ChildProcess 对象可能会触发 'error' 事件。 向一个已经退出的子进程发送信号不是一个错误，但可能有无法预料的后果。 具体来说，如果进程的标识符 PID 已经被重新分配给其他进程，则信号将会被发送到该进程，而这可能产生意外的结果。

虽然该函数被称为 kill，但传给子进程的信号可能实际上不会终止该进程。

参阅 kill(2)。

在 Linux 上，子进程的子进程在试图杀死其父进程时将不会被终止。 当在 shell 中运行新进程、或使用 ChildProcess 的 shell 选项时，可能会发生这种情况：

```js
'use strict';
const { spawn } = require('child_process');

const subprocess = spawn(
    'sh',
    [
        '-c',
        `node -e "setInterval(() => {
            console.log(process.pid, 'is alive')
        }, 500);"`
    ], {
        stdio: ['inherit', 'inherit', 'inherit']
    }
);

setTimeout(() => {
    subprocess.kill(); // 不会终止 shell 中的 Node.js 进程。
}, 2000);
```

### subprocess.killed

* <boolean> 当使用 subprocess.kill() 成功发送信号到子进程后，该值会被设为 true。

subprocess.killed 属性表明子进程是否已成功接收到来着 subprocess.kill() 的信号。 killed 属性并不表明子进程是否已被终止。

### subprocess.pid

* <integer>

返回子进程的进程标识符（PID）。

```js
const { spawn } = require('child_process');
const grep = spawn('grep', ['ssh']);

console.log(`衍生的子进程的 pid：${grep.pid}`);
grep.stdin.end();
```

### subprocess.ref()

调用 subprocess.unref() 之后再调用 subprocess.ref() 将会为子进程恢复已删除的引用计数，强迫父进程在退出自身之前等待子进程退出。

```js
const { spawn } = require('child_process');

const subprocess = spawn(process.argv[0], ['child_program.js'], {
    detached: true,
    stdio: 'ignore'
});

subprocess.unref();
subprocess.ref();
```

### subprocess.send(message[, sendHandle[, options]][, callback])

* message <Object>
* sendHandle <Handle>
* options <Object> options 参数（如果存在）是一个对象，用于参数化某些类型句柄的发送。options 支持以下属性：
    * keepOpen <boolean> 传给 net.Socket 实例时可以使用的值。当设为 true 时，则 socket 在发送过程中会保持打开状态。默认值: false。
* callback <Function>
* 返回: <boolean>

当父进程和子进程之间已建立了一个 IPC 通道时（例如，使用 child_process.fork()）， subprocess.send() 方法可用于发送消息到子进程。 当子进程是一个 Node.js 实例时，则消息可以通过 'message' 事件接收。

消息通过序列化和解析进行传递，接收到消息可能跟最初发送的不完全一样。

例如，在父进程的脚本中：

```js
const cp = require('child_process');
const n = cp.fork(`${__dirname}/sub.js`);

n.on('message', (m) => {
    console.log('父进程收到消息', m);
});

// 使子进程打印: 子进程收到消息 { hello: 'world' }
n.send({ hello: 'world' });
```

子进程的脚本 'sub.js' 可能如下：

```js
process.on('message', (m) => {
    console.log('子进程收到消息', m);
});

// 使父进程输出: 父进程收到消息 { foo: 'bar', baz: null }
process.send({ foo: 'bar', baz: NaN });
```

子 Node.js 进程有一个自己的 process.send() 方法，允许子进程发送消息回父进程。

当发送 {cmd: 'NODE_foo'} 消息时有一种特殊情况。 cmd 属性中包含 NODE_ 前缀的消息是预留给 Node.js 内核内部使用的，将不会触发子进程的 'message' 事件。 相反，这种消息可使用 'internalMessage' 事件触发，且会被 Node.js 内部消费。 应用程序应避免使用此类消息或监听 'internalMessage' 事件，因为它可能会被更改且不会通知。

可能传给 subprocess.send() 的可选的 sendHandle 参数用于将 TCP 服务器或 socket 对象传给子进程。 子进程将会接收该对象作为传给在 'message' 事件上注册的回调函数的第二个参数。 在 socket 中接收和缓冲的任何数据都不会被发送给子进程。

可选的 callback 是一个函数，它在消息被发送之后、子进程已收到消息之前被调用。 该函数被调用时只有一个参数：当成功时是 null，当失败时是一个 Error 对象。

如果没有提供 callback 函数，且消息无法被发送，则 ChildProcess 对象将会触发 'error' 事件。 这是有可能发生的，例如当子进程已经退出时。

如果通道已关闭、或当未发送的消息的积压超过阈值使其无法发送更多时， subprocess.send() 将会返回 false。 否则，该方法返回 true。 callback 函数可用于实现流量控制。

#### 示例：发送 server 对象

sendHandle 参数可用于将一个 TCP server 对象的句柄传给子进程，如以下示例所示：

```js
const subprocess = require('child_process').fork('subprocess.js');

// 打开 server 对象，并发送该句柄。
const server = require('net').createServer();
server.on('connection', (socket) => {
    socket.end('由父进程处理');
});
server.listen(1337, () => {
    subprocess.send('server', server);
});
```

子进程接收 server 对象如下：

```js
process.on('message', (m, server) => {
    if (m === 'server') {
        server.on('connection', (socket) => {
            socket.end('由子进程处理');
        });
    }
});
```

一旦服务器在父进程和子进程之间是共享的，则一些连接可被父进程处理，另一些可被子进程处理。

上面的示例使用了一个由 net 模块创建的服务器，虽然 dgram 模块的服务器使用完全相同的工作流程，但它监听 'message' 事件而不是 'connection' 事件，且使用 server.bind() 而不是 server.listen()。 目前仅在 Unix 平台上支持这一点。

#### 示例：发送 socket 对象

类似地， sendHandle 参数可用于将 socket 的句柄传给子进程。 以下示例衍生了两个子进程，分别用于处理 "normal" 连接或优先处理 "special" 连接：

```js
const { fork } = require('child_process');
const normal = fork('subprocess.js', ['normal']);
const special = fork('subprocess.js', ['special']);

// 开启 server，并发送 socket 给子进程。
// 使用 `pauseOnConnect` 防止 socket 在被发送到子进程之前被读取。
const server = require('net').createServer({ pauseOnConnect: true });
server.on('connection', (socket) => {
    // 特殊优先级。
    if (socket.remoteAddress === '74.125.127.100') {
        special.send('socket', socket);
        return;
    }
    // 普通优先级。
    normal.send('socket', socket);
});
server.listen(1337);
```

subprocess.js 会接收该 socket 句柄作为传给事件回调函数的第二个参数：

```js
process.on('message', (m, socket) => {
    if (m === 'socket') {
        if (socket) {
            // 检查客户端 socket 是否存在。
            // socket 在被发送与被子进程接收这段时间内可被关闭。
            socket.end(`请求使用 ${process.argv[2]} 优先级处理`);
        }
    }
});
```

一旦一个 socket 已被传给了子进程，则父进程不再能够跟踪 socket 何时被销毁。 为了表明这个， .connections 属性会变成 null。 当发生这种情况时，建议不要使用 .maxConnections。

建议在子进程中的任何 'message' 句柄都需要验证 socket 是否存在，因为连接可能会在它发送给子进程的这段时间内被关闭。

### subprocess.stderr

* <stream.Readable>

表示子进程的 stderr 的可读流。

如果子进程被衍生时 stdio[2] 被设置为 'pipe' 以外的任何值，则该值将会是 null。

subprocess.stderr 是 subprocess.stdio[2] 的别名。 两个属性都将会指向相同的值。

### subprocess.stdin

* <stream.Writable>

表示子进程的 stdin 的可写流。

如果子进程等待读取其所有的输入，则子进程将不会继续，直到流已通过 end() 关闭。

如果子进程被衍生时 stdio[0] 被设置为 'pipe' 以外的任何值，则该值将会是 null。

subprocess.stdin 是 subprocess.stdio[0] 的别名。 两个属性都将会指向相同的值。

### subprocess.stdio

* <Array>

一个到子进程的管道的稀疏数组，对应于传给 child_process.spawn() 的被设为 'pipe' 值的 stdio 选项中的位置。 subprocess.stdio[0]、 subprocess.stdio[1] 和 subprocess.stdio[2] 也分别可用作 subprocess.stdin、 subprocess.stdout 和 subprocess.stderr。

在下面的示例中，只有子进程的 fd 1（stdout）被配置为一个管道，所以只有父进程的 subprocess.stdio[1] 是一个流，数组中的其他值都是 null。

```js
const assert = require('assert');
const fs = require('fs');
const child_process = require('child_process');

const subprocess = child_process.spawn('ls', {
    stdio: [
        0, // 使用父进程的 stdin 用于子进程。
        'pipe', // 把子进程的 stdout 通过管道传到父进程 。
        fs.openSync('err.out', 'w') // 把子进程的 stderr 定向到一个文件。
    ]
});

assert.strictEqual(subprocess.stdio[0], null);
assert.strictEqual(subprocess.stdio[0], subprocess.stdin);

assert(subprocess.stdout);
assert.strictEqual(subprocess.stdio[1], subprocess.stdout);

assert.strictEqual(subprocess.stdio[2], null);
assert.strictEqual(subprocess.stdio[2], subprocess.stderr);
```

### subprocess.stdout

* <stream.Readable>

表示子进程的 stdout 的可读流。

如果子进程被衍生时 stdio[1] 被设置为 'pipe' 以外的任何值，则该值将会是 null。

subprocess.stdout 是 subprocess.stdio[1] 的别名。 两个属性都将会指向相同的值。

```js
const { spawn } = require('child_process');

const subprocess = spawn('ls');

subprocess.stdout.on('data', (data) => {
    console.log(`接收到数据块 ${data}`);
});
```

### subprocess.unref()

默认情况下，父进程将会等待已分离的子进程退出。 为了防止父进程等待给定的 subprocess 退出，可使用 subprocess.unref() 方法。 这样做将会导致父进程的事件循环不会在其引用计数中包括子进程，允许父进程独立于子进程退出，除非子进程与父进程之间已建立了 IPC 通道。

```js
const { spawn } = require('child_process');

const subprocess = spawn(process.argv[0], ['child_program.js'], {
    detached: true,
    stdio: 'ignore'
});

subprocess.unref();
```

## maxBuffer与Unicode

maxBuffer选项指定了stdout或stderr上允许的最大字节数。如果超过这个值，则子进程会被终止。这会影响多字节字符编码的输出，如UTF-8或UTF-16。例如，console.log('中文测试')将会发送13个UTF-8编码的字节到stdout，尽管只有4个字符。

## shell的要求

Shell需要能理解-c开关。如果shell是'cmd.exe'，则它需要能理解/d /s /c开关，且命令行解析需要能兼容。

## Windows默认的shell

尽管微软指定在根环境中 %COMSPEC% 必须包含 'cmd.exe' 的路径，但子进程并不总是遵循相同的要求。 因此，在可以衍生 shell 的 child_process 函数中，如果 process.env.ComSpec 不可以，则使用 'cmd.exe' 作为后备。
