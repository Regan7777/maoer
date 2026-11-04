---
title: 4、trojan协议搭建节点
description: "Trojan 协议自建节点深度教程：剖析其将流量伪装为真实 HTTPS 网站的底层逻辑，手把手教你配置域名解析、SSL 证书申请与 Trojan 服务端。"
createTime: 2026/11/04 14:00:00
author: 猫耳
tags:
  - 节点搭建
  - Trojan
  - TLS伪装
  - HTTPS
categories:
  - 随笔
permalink: /article/node4/
dateModified: 2026/11/04 18:30:00
---

# 4、Trojan协议搭建节点：最真实的特洛伊木马伪装实战

希腊神话中有一个著名的故事：希腊联军久攻特洛伊城不下，于是制作了一匹巨大的木制战马留在城外，假装撤军；特洛伊人把木马当作战利品运进城内，到了夜晚，藏在木马肚子里的勇士钻出来打开城门，一举破城。

计算机网络中的 **Trojan（特洛伊木马协议）**，其设计灵感就来源于这个千古神话。

在它诞生之前，很多开发者一直在绞尽脑汁地发明各种稀奇古怪的新加密算法；而 Trojan 的作者却反其道而行之：
**“为什么我们要自己造密码锁？既然全世界都在用标准的 HTTPS 网站协议，我们直接把自己变成一个合法合规的 HTTPS 网站不就行了吗？”**

这种思路彻底改变了网络防封锁的历史进程。本文将用完全通俗的大白话，教你从申请域名、申请安全证书到成功搭建起属于自己的 Trojan 节点！

---

## 一、Trojan 工作原理大白话解剖

我们平时用浏览器打开淘宝、百度、网银时，网址开头都是 `https://`，走的都是标准的 **443 端口**。
任何监听设备来看，只能看到你正在和一个拥有合法国际证书的网站进行标准的 TLS 加密对话。

Trojan 的核心天才之处在于**双重身份**：

```mermaid
flowchart TD
    Request[外界访问 443 端口] --> Core{Trojan 门卫检查}
    Core -->|1. 你的代理客户端 (携带正确密码钥匙)| ProxyPass[建立高速代理通道 -> 畅游海外]
    Core -->|2. 普通网民 / 便衣审查探针 (无密码或密码错误)| WebFall[自动回落转交给 Nginx 网页服务]
    WebFall --> HTML[正常显示一个漂亮的个人博客或商贸静态主页]
```

1. **对你而言（主人回家）**：你的客户端在建立连接时，会附带一段正确的秘密口令。Trojan 验证通过后，立刻为你开启穿梭隧道；
2. **对审查探针而言（便衣敲门）**：任何网络审查设备或者普通网友在浏览器里直接输入你的域名，Trojan 就会优雅地把请求转交给真正的网页服务器（比如 Nginx），页面上赫然展示着一个正规的英文企业宣传网页或者个人摄影博客！

审查系统抓不到任何违规破绽，只能把它当作一个普普通通的海外个人小网站，从而实现长期超强抗封锁！

---

## 二、搭建前两大准备（域名与证书）

因为 Trojan 必须伪装成真实网站，所以它需要：
1. **一个域名**：代表网站的名字（比如 `myvps123.xyz`）；
2. **一张 SSL 安全证书**：代表网站通过了国际公认的身份认证（浏览器地址栏上的那把小绿锁）。

### 1. 域名解析配置
去 Namesilo、腾讯云国际、Cloudflare 等平台花几块钱买一个便宜的后缀域名（如 `.xyz`、`.top`）。
登录你的域名后台，添加一条 **A 记录**：
- **主机记录（Name）**：`@` 或者 `node`
- **记录值（Value）**：填写你的海外 VPS 真实 IP 地址

*注意：添加完成后，在电脑命令行里运行 `ping 你的域名`，如果返回的 IP 正是你的 VPS IP，说明域名解析已经成功生效！*

### 2. 免费申请官方 SSL 证书
连接你的海外 VPS 终端，使用开源社区最著名的自动证书脚本 `acme.sh` 申请证书：

```bash
# 安装系统必要工具包并安装 acme.sh 证书引擎
apt update -y && apt install -y curl socat certbot
curl https://get.acme.sh | sh -s email=your_email@gmail.com
source ~/.bashrc

# 确保此时服务器的 80 端口没有被其他程序占用，申请证书
~/.acme.sh/acme.sh --issue -d 你的域名.com --standalone

# 创建保存证书的专属目录，并将证书安装过去
mkdir -p /etc/trojan
~/.acme.sh/acme.sh --install-cert -d 你的域名.com \
  --key-file       /etc/trojan/private.key  \
  --fullchain-file /etc/trojan/fullchain.cer
```
执行完毕后，私钥 `private.key` 和证书 `fullchain.cer` 就已经在你的服务器中准备就绪了。

---

## 三、部署 Trojan-Go 高性能服务端

目前最推荐的是支持多路复用与高性能并发的 **Trojan-Go** 版本：

### 1. 下载并安装主程序
```bash
# 获取官方最新版本并解压到执行目录
wget https://github.com/p4gefau1t/trojan-go/releases/latest/download/trojan-go-linux-amd64.zip
apt install -y unzip
mkdir -p /usr/local/bin/trojan-go
unzip trojan-go-linux-amd64.zip -d /usr/local/bin/trojan-go/
chmod +x /usr/local/bin/trojan-go/trojan-go
```

### 2. 编写服务端配置文件
在服务器上创建并编辑 `/etc/trojan/config.json`：
```bash
nano /etc/trojan/config.json
```
写入以下配置内容（注意替换你自己的密码和域名）：

```json
{
  "run_type": "server",
  "local_addr": "0.0.0.0",
  "local_port": 443,
  "remote_addr": "127.0.0.1",
  "remote_port": 80,
  "password": [
    "你的专属强密码123456"
  ],
  "ssl": {
    "cert": "/etc/trojan/fullchain.cer",
    "key": "/etc/trojan/private.key",
    "sni": "你的域名.com"
  }
}
```
*提示：按 `Ctrl + O` 回车保存，按 `Ctrl + X` 退出。*

### 3. 配置开机自启并启动服务
```bash
cat <<EOF > /etc/systemd/system/trojan-go.service
[Unit]
Description=Trojan-Go Service
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/trojan-go/trojan-go -config /etc/trojan/config.json
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now trojan-go
```

检查服务运行状态：
```bash
systemctl status trojan-go
```
看到绿色的 `active (running)` 即代表服务端已大功告成！

---

## 四、客户端连接与参数填写指南

在手机小火箭（Shadowrocket）、v2rayNG 或电脑 Clash Verge Rev 中添加节点时：
- **协议类型（Type）**：选择 `Trojan`
- **服务器地址（Server）**：填入你的**域名**（如 `node.yourdomain.com`，不要填纯 IP）
- **端口（Port）**：填 `443`
- **密码（Password）**：填入你上面设置的密码
- **SNI / Peer 域名**：填入你的域名（用于 TLS 握手验证）
- **跳过证书验证（Allow Insecure）**：**必须选择关闭（False）**！因为我们用的是受国际认可的正规证书，验证通过才是合法的 HTTPS 流量！

---

## 五、常见高频问答 (FAQ)

> 💡 **排查指南**：自建过程中若遇到连通性或线路速度瓶颈，推荐使用 [在线 IP 与网络测试工具](/article/iptest/) 进行测速排查；线路术语可参阅 [VPS行业黑话指南](/article/vpscant/)，机场推荐可参阅 [神行加速全面深度测评](/article/shenxing/)。

### Q1：为什么申请 SSL 证书时总是报错超时（Timeout）或验证失败？
**答**：通常有两大原因：
1. **域名解析还没完全生效**：你刚在域名管理商添加的 A 记录，全球 DNS 同步可能需要 5~10 分钟。先用本地命令行 `ping 你的域名`，确保返回的是你的 VPS IP 再申请；
2. **80 端口被防火墙挡住了**：申请证书时，Let's Encrypt 官方机构会向你的 80 端口发送验证数据。请确保云平台后台安全组已经放行了 80 端口，且服务器上没有其他程序（如 Apache/Nginx）强行占用 80 端口。

### Q2：我一定要在服务器上装一个真正的网页来伪装吗？不装会不会被抓？
**答**：配置了 `remote_addr` 回落地址后，建议顺便安装一个轻量的 Nginx 并下载一个免费的静态 HTML 模板（比如免费的英文 HTML 企业模板解压到 `/var/www/html`）。如果不装，当有人通过浏览器访问你的域名时，可能会出现 502 Bad Gateway 错误；虽然不会直接暴露代理，但如果展现的是一个真实漂亮的网页，伪装度会提升到无可挑剔的最高境界。

### Q3：为什么 Trojan 一定要用 443 端口？我能改成别的端口吗？
**答**：技术上可以改成任意端口，但**改了端口就失去了 Trojan 最大的伪装灵魂**！全世界的 HTTPS 网站默认都是 443 端口。如果你把它改成 `12345`，哪怕数据流外表依然是 TLS 加密，但审查设备会怀疑：“为什么有人在非标端口上运行高强度的长连接 TLS？”，这就容易引来主动探测。

### Q4：Trojan 节点的连接速度为什么感觉比 Shadowsocks 稍微慢一点点？
**答**：这是正常现象。因为 Trojan 采用了正规的 TLS 握手，并且在传输过程中进行了严密的完整性校验和证书身份比对，安全等级极高。相比于毫无顾忌裸奔的原版 Shadowsocks，这会带来微小的延迟开销（通常只有几毫秒），但在如今高性能 CPU 和高速光纤下，日常刷 4K 视频完全感知不到任何差别。

## 📌 推荐延伸阅读与技术指南
- **板块导航**：[节点搭建板块说明与系列导读](/article/node-desc/)
- **上一篇**：[3、shadowsocks协议搭建节点](/article/node3/)
- **下一篇**：[5、VMESS+WS+TLS+WEB搭建](/article/node5/)
- **VPS术语科普**：[VPS 行业黑话完全指南（线路套路与回程优化）](/article/vpscant/)
- **线路深度测评**：[出海线路深度测评：BGP 中转与 IPLC/IEPL 专线全解析](/article/network-analysis/)
- **机场推荐**：[神行加速全面测评：全 IPLC 专线架构与晚高峰实测](/article/shenxing/)
- **知识库笔记版**：[4、trojan协议搭建节点（专栏版）](/notes/cheping/nodeConstruction/node4/)
