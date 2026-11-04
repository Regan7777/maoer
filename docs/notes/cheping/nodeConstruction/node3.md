---
title: 3、shadowsocks协议搭建节点
description: "Shadowsocks (SS) 协议节点搭建实战：从 VPS 购买、环境初始化到 SS 服务端部署与客户端配置，掌握经典对称加密代理协议的搭建全流程。"
createTime: 2026/11/04 13:00:00
author: 猫耳
tags:
  - 节点搭建
  - Shadowsocks
  - SS协议
  - 部署教程
categories:
  - 节点搭建
permalink: /notes/cheping/nodeConstruction/node3/
dateModified: 2026/11/04 18:30:00
---

# 3、Shadowsocks协议搭建节点：轻量极速的经典轻骑兵

在整个网络代理的江湖历史中，**Shadowsocks（俗称“影梭”或“SS”）** 绝对是名留青史的开山鼻祖。

很多新手朋友可能会问：
“现在大家都说 VLESS 和 Trojan 伪装厉害，老牌的 Shadowsocks 是不是已经落伍淘汰了？”
“为什么我买的高端 IPLC 专线机场里，几乎所有节点清一色依然全是 Shadowsocks 协议？”

答案很简单：**因为 Shadowsocks 拥有全行业最极致的轻量级与超强吞吐性能！**
在不需要考虑防火墙审查的内网专线环境，或者家庭软路由、低性能电视盒子上，Shadowsocks 的加解密速度依然是王者级别的存在。

本文将用完全通俗的大白话，带你彻底搞懂 Shadowsocks 的来龙去脉，并手把手教你如何搭建安全稳定的现代版 **Shadowsocks 2022 / AEAD** 节点！

---

## 一、Shadowsocks 到底是什么？（加密轻骑兵大白话）

用一句话概括：**Shadowsocks 就是给传统的局域网代理套上了一层加密锁**。

```mermaid
flowchart LR
    subgraph 传统 SOCKS5 代理 (全明文裸奔)
    A1[本地电脑] -->|全明文发送: 账号密码/网址内容| B1[中间海关]
    B1 -->|一览无余,直接阻断| C1[目标网站]
    end

    subgraph Shadowsocks 协议 (铁盒加密锁)
    A2[本地电脑 SS 客户端] -->|对称加密成密文| B2[中间海关]
    B2 -->|不知道是什么,但看得出是加密流| C2[海外 SS 服务端]
    C2 -->|解密并代为请求| D2[目标网站]
    end
```

在很久以前，企业内部经常使用一种叫 **SOCKS5** 的代理协议来连通公司内网。但 SOCKS5 协议本身没有任何加密机制，数据在公网上纯属“裸奔”。

Shadowsocks 的核心天才设计在于：
它在你的本地电脑（或手机）和海外 VPS 之间各放了一个程序：
1. **本地客户端（ss-local）**：伪装成一个本地的 SOCKS5 服务，把浏览器发来的明文请求，用对称加密算法锁进密码铁盒；
2. **海外服务端（ss-server）**：收到铁盒后，用事先约定好的唯一密码钥匙把锁打开，代替你向目标网站请求数据，再把返回的数据同样加密打包寄回给你。

---

## 二、加密算法的大白话防坑指南

很多小白在配置 SS 时，看到一长串英文加密算法列表（`rc4-md5`、`aes-256-cfb`、`aes-256-gcm`、`chacha20-ietf-poly1305`、`2022-blake3`）直接懵圈。

记住以下这个避坑红绿灯：

| 加密套件分类 | 具体算法名称 | 安全性与状态 | 大白话评价 |
| :--- | :--- | :--- | :--- |
| **严重报废红灯（坚决不用）** | `rc4-md5`, `aes-128-cfb`, `aes-256-cfb` | 极度危险（已被破解） | 相当于纸糊的锁，审查系统几秒钟就能破解识别并秒封 IP |
| **标准通用绿灯（推荐经典）** | `aes-256-gcm`, `chacha20-ietf-poly1305` | 强安全性 (AEAD) | 带有防篡改校验码的坚固锁头，手机 CPU 跑起来极快省电 |
| **现代新一代（目前最强）** | `2022-blake3-aes-128-gcm`, `2022-blake3-aes-256-gcm` | 最高抗封锁 (SS 2022) | 彻底消除中间人重放攻击漏洞，当今最新官方标准 |

---

## 三、五分钟极速服务端部署（保姆级实操）

目前开源社区最推荐、性能最好的版本是由 Rust 语言重写的 **`shadowsocks-rust`**，占用内存只有十几兆，跑满千兆带宽毫不吃力。

### 第一步：连接你的海外 VPS 终端
打开电脑上的 SSH 终端（如 FinalShell、Xshell 或 PowerShell），输入以下指令连接服务器：
```bash
ssh root@你的服务器IP地址
```
输入你购买 VPS 时设置的 root 管理员密码并回车。

### 第二步：一键下载与解压安装
在终端中依次粘贴执行以下命令：

```bash
# 更新系统基础软件包环境
apt update -y && apt install -y wget tar curl

# 自动获取 shadowsocks-rust 官方最新版本并下载解压
VER=$(curl -s https://api.github.com/repos/shadowsocks/shadowsocks-rust/releases/latest | grep tag_name | cut -d '"' -f 4)
wget https://github.com/shadowsocks/shadowsocks-rust/releases/download/${VER}/shadowsocks-${VER}.x86_64-unknown-linux-musl.tar.xz

# 解压并部署核心程序
tar -xf shadowsocks-${VER}.x86_64-unknown-linux-musl.tar.xz
mv ssserver /usr/local/bin/
chmod +x /usr/local/bin/ssserver
```

### 第三步：创建并编辑配置文件
创建配置目录并写入配置文件：
```bash
mkdir -p /etc/shadowsocks
nano /etc/shadowsocks/config.json
```
在打开的文本编辑器中，粘贴以下配置内容（请务必修改密码和端口）：

```json
{
  "server": "0.0.0.0",
  "server_port": 8388,
  "password": "请在这里设置你的专属高强度密码123!@#",
  "method": "aes-256-gcm",
  "timeout": 300,
  "mode": "tcp_and_udp"
}
```
*提示：按键盘 `Ctrl + O` 然后回车保存，按 `Ctrl + X` 退出编辑器。*

### 第四步：配置开机后台自启动服务
让 SS 在后台默默运行，即使服务器重启也会自动开启：

```bash
cat <<EOF > /etc/systemd/system/shadowsocks.service
[Unit]
Description=Shadowsocks-rust Server
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/ssserver -c /etc/shadowsocks/config.json
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 启动服务并设置开机自启
systemctl daemon-reload
systemctl enable --now shadowsocks
```

检查运行状态：
```bash
systemctl status shadowsocks
```
如果你看到绿色的 **`active (running)`**，恭喜你，你的专属 Shadowsocks 节点就已经完美运行起来了！

---

## 四、客户端极速导入与连接

客户端配置非常简单，只需填入你在上面设置的四个关键参数：
1. **服务器地址（Server）**：你的 VPS 公网 IP
2. **端口（Port）**：你设置的端口号（如 `8388`）
3. **加密方式（Encryption）**：你选择的算法（如 `aes-256-gcm`）
4. **密码（Password）**：你自定义的复杂密码

- **手机端（小火箭 Shadowrocket / v2rayNG）**：点击右上角添加节点，类型选择 `Shadowsocks`，把上述四项填进去即可一键启动。
- **电脑端（Clash Verge Rev）**：可以在代理配置文件的 `proxies` 区域直接填入 SS 节点参数。

---

## 五、常见高频问答 (FAQ)

> 💡 **排查指南**：自建节点若遇延迟高或阻断，可使用 [在线 IP 与网络测试工具](/notes/cheping/study/iptest/) 排查；线路挑选参考 [VPS行业黑话指南](/notes/cheping/study/vpscant/)，机场推荐可参阅 [神行加速全面深度测评](/notes/cheping/reviews/shenxing/)。

### Q1：为什么搭建好后，在客户端测 Ping 显示“连接超时”或“504 Timeout”？
**答**：初学者最常犯的错误就是**“服务器控制台的安全组端口没有放行”**！
很多云厂商（如阿里云国际、腾讯云、AWS、甲骨文 Oracle、华为云等）在后台都有一个独立的外置防火墙。即使你在 Linux 系统内部开启了服务，如果云平台控制台后台的“入方向安全组规则”没有添加放行你设置的端口（如 `8388` 的 TCP 和 UDP），所有连接都会在最外层被直接拦截。

### Q2：为什么我的 Shadowsocks 刚搭好用了一天，IP 怎么就被封了？
**答**：在目前的公共国际互联公网上，直接使用未经伪装的原版 Shadowsocks 是非常容易被深度包检测（DPI）通过机器学习模型捕获的。如果你使用的是普通公网小鸡（没有走 IPLC 专线），建议优先选择专栏第 4 篇的 **Trojan** 或第 6 篇的 **VLESS Reality** 协议。Shadowsocks 目前最推荐的使用场景是作为内网中转或专线落地协议。

### Q3：`aes-256-gcm` 和 `chacha20-ietf-poly1305` 这两个加密算法该选哪一个？
**答**：取决于你的客户端设备：
- 如果你的设备是 **电脑（Intel / AMD 处理器）** 或带有 AES 硬件加速芯片的现代智能手机，选择 **`aes-256-gcm`**，运行速度最快、性能最好；
- 如果你的设备是 **较老的手机、电视盒子、树莓派或低配路由器**，选择 **`chacha20-ietf-poly1305`**，它在没有硬件加速的精简芯片上发热量最小、最省电。

### Q4：Shadowsocks 支持打外服游戏吗？
**答**：支持，但关键要看你的服务端配置中是否启用了 `"mode": "tcp_and_udp"`。绝大多数游戏（如 Steam 联机、绝地求生、英雄联盟外服、主机连线）都需要依赖 UDP 数据包传输。只要服务端开启了 UDP 支持，并且客户端开启了 TUN 虚拟网卡代理模式，就可以顺畅加速外服游戏。

## 📌 推荐延伸阅读与技术指南
- **板块导航**：[节点搭建板块说明与系列导读](/notes/cheping/nodeConstruction/description/)
- **上一篇**：[2、如何绕过防火墙的拦截](/notes/cheping/nodeConstruction/node2/)
- **下一篇**：[4、trojan协议搭建节点](/notes/cheping/nodeConstruction/node4/)
- **VPS术语科普**：[VPS 行业黑话完全指南（线路套路与回程优化）](/notes/cheping/study/vpscant/)
- **线路深度测评**：[出海线路深度测评：BGP 中转与 IPLC/IEPL 专线全解析](/article/network-analysis/)
- **机场推荐**：[神行加速全面测评：全 IPLC 专线架构与晚高峰实测](/notes/cheping/reviews/shenxing/)
- **博客阅读版**：[3、shadowsocks协议搭建节点（博客版）](/article/node3/)
