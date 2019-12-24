/*
 * @Author: yanglinylin.yang 
 * @Date: 2019-12-24 11:18:59 
 * @Last Modified by: yanglinylin.yang
 * @Last Modified time: 2019-12-24 11:44:06
 */

const buf = Buffer.from('hello world', 'ascii');
console.log(buf.toString('hex'));
// 打印: 68656c6c6f20776f726c64
console.log(buf.toString('base64'));
// 打印: aGVsbG8gd29ybGQ=
console.log(Buffer.from('fhqwhgads', 'ascii'));
// 打印: <Buffer 66 68 71 77 68 67 61 64 73>
console.log(Buffer.from('fhqwhgads', 'utf16le'));
// 打印: <Buffer 66 00 68 00 71 00 77 00 68 00 67 00 61 00 64 00 73 00>


