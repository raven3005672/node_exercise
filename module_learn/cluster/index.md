# Cluster集群

[本部分文档](http://nodejs.cn/api/cluster.html)

单个NodeJS实例运行在单个线程中。为了充分利用多核系统，有时需要启用一组NodeJs进程去处理负载任务。

cluster模块可以创建共享服务器端口的子进程。

工作进程可以共享任何TCP连接。

在Windows上，尚无法在工作进程中设置命名管道服务器。
