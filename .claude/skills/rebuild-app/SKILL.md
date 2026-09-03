---
name: rebuild-app
description: 重新打包记账 APP，生成 Windows 安装包（.exe）。当用户想打包、生成安装包、重新打包 APP 时使用。
---

# 重新打包记账 APP

把记账 APP 重新打包成 Windows 安装包（NSIS 的 .exe），按下面步骤：

1. 用**后台方式**运行 `npm run tauri build`（release 编译耗时较长，可能几分钟，务必后台运行，不要前台阻塞卡住）。
2. 等待打包完成。这个命令会先编译前端、再编译 Rust 外壳、最后生成安装包。
3. 打包成功后，安装包在 `src-tauri/target/release/bundle/nsis/记账APP_0.1.0_x64-setup.exe`。确认文件已生成，并把完整路径和文件大小告诉用户。
4. 如果打包报错，把关键错误整理成大白话告诉用户，并给出排查建议。
