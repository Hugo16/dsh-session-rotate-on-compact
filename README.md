# DSH Session Rotate on Compact

用于 DSH 的会话轮换插件。

当 DSH 完成一次自动或手动 Compact 后，插件会生成新的 Session ID，让代理 API 将下一次请求识别为新会话，从而触发账号轮询。

## 功能

* DSH 会话保持不变
* Compact 成功后切换 Session ID
* 自动 Compact 和手动 Compact 都支持
* Compact 失败时不切换
* 不重新发送已经压缩掉的历史消息

## 安装

在 DSH 项目目录执行：

```powershell
pnpm dsh plugin --profile web add "插件目录路径"
```

安装后重启 DSH。

## 版本

0.1.0
