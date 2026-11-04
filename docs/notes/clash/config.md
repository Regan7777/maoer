---
title: Clash 分流规则与配置进阶：Proxy Groups、Rule Provider 与自定义分流
description: "Clash 进阶配置与分流规则核心教程：深度剖析 Proxy Groups 策略组机制、Rule Provider 外部规则集与自定义分流写法，打造免人工维护的高效规则库。"
createTime: 2026/11/04 13:00:00
author: 猫耳
tags:
  - Clash配置
  - 规则分流
  - 策略组
  - RuleProvider
permalink: /notes/clash/config/
dateModified: 2026/11/04 18:30:00
---

# Clash 分流规则与配置进阶：Proxy Groups、Rule Provider 与自定义分流

一份优秀的 Clash 配置文件能够做到**国内应用极速直连、广告域名静默丢弃、海外网站毫秒秒开、流媒体/AI 自动定向**，完全无需人工频繁切节点。本篇教程带你深度掌握 Clash 配置文件的核心结构与实战编写。

---

## 一、Clash 配置文件的四大核心段落

标准的 Clash 配置文件由以下四个基础顶级字段构成：

```yaml
# 1. 基础网络端口与系统选项
port: 7890
socks-port: 7891
mixed-port: 7890
allow-lan: false
mode: rule
log-level: info
ipv6: false

# 2. DNS 服务器与 Fake-IP 模式配置
dns:
  enable: true
  listen: 0.0.0.0:1053
  enhanced-mode: fake-ip
  fake-ip-range: 198.18.0.1/16
  nameserver:
    - 223.5.5.5
    - 119.29.29.29
  fallback:
    - https://dns.google/dns-query
    - https://1.1.1.1/dns-query

# 3. 节点定义 (Proxies)
proxies:
  - { name: "香港专线01", type: vless, server: 1.2.3.4, port: 443, ... }

# 4. 策略组定义 (Proxy Groups)
proxy-groups:
  # ...

# 5. 规则集与路由规则 (Rules / Rule Providers)
rules:
  # ...
```

---

## 二、策略组（Proxy Groups）实战搭配模式

策略组是节点的组织容器，支持以下常见策略类型：

```yaml
proxy-groups:
  # 主节点选择（手动切换）
  - name: 🚀 节点选择
    type: select
    proxies:
      - ♻️ 自动选优
      - 🇭🇰 香港专线01
      - 🇯🇵 日本专线01
      - 🇺🇸 美国专线01

  # 自动测速组（每 300 秒测一次，自动选择延迟最低的节点）
  - name: ♻️ 自动选优
    type: url-test
    url: http://cp.cloudflare.com/generate_204
    interval: 300
    tolerance: 50
    proxies:
      - 🇭🇰 香港专线01
      - 🇯🇵 日本专线01
      - 🇺🇸 美国专线01

  # 流媒体专属组（定向流媒体解锁节点）
  - name: 🎬 国际流媒体
    type: select
    proxies:
      - 🇭🇰 香港专线01
      - 🇺🇸 美国专线01

  # 人工智能专属组（OpenAI / Claude / Gemini）
  - name: 🤖 人工智能
    type: select
    proxies:
      - 🇺🇸 美国专线01
      - 🇯🇵 日本专线01
```

---

## 三、常用规则类型（Rule Types）语法详解

Clash 的规则自上而下匹配，**一旦命中立即执行相应出站并终止后续匹配**。

```yaml
rules:
  # 1. 域名精确匹配（只有完全相等的域名才命中）
  - DOMAIN,google.com,🚀 节点选择

  # 2. 域名后缀匹配（包含所有子域名，如 mail.google.com, drive.google.com）
  - DOMAIN-SUFFIX,google.com,🚀 节点选择
  - DOMAIN-SUFFIX,youtube.com,🎬 国际流媒体
  - DOMAIN-SUFFIX,openai.com,🤖 人工智能
  - DOMAIN-SUFFIX,anthropic.com,🤖 人工智能

  # 3. 关键词匹配（域名中包含此关键词即可命中）
  - DOMAIN-KEYWORD,netflix,🎬 国际流媒体

  # 4. IP 掩码网段匹配
  - IP-CIDR,127.0.0.0/8,DIRECT
  - IP-CIDR,192.168.0.0/16,DIRECT

  # 5. 地理位置数据库匹配 (GeoIP)
  - GEOIP,CN,DIRECT

  # 6. 最终兜底规则 (未匹配到上面任何规则的流量走向)
  - MATCH,🚀 节点选择
```

---

## 四、引入现代远程规则集（Rule Provider）

传统的 rules 列表写在配置文件里极其臃肿。通过现代 `rule-providers` 机制，可以直接引用 GitHub 上社区维护维护的定期自动更新规则包：

```yaml
rule-providers:
  reject:
    type: http
    behavior: domain
    url: "https://raw.githubusercontent.com/Loyalsoldier/clash-rules/release/reject.txt"
    path: ./ruleset/reject.yaml
    interval: 86400

  direct:
    type: http
    behavior: domain
    url: "https://raw.githubusercontent.com/Loyalsoldier/clash-rules/release/direct.txt"
    path: ./ruleset/direct.yaml
    interval: 86400

rules:
  - RULE-SET,reject,REJECT
  - RULE-SET,direct,DIRECT
  - GEOIP,CN,DIRECT
  - MATCH,🚀 节点选择
```

这种架构下，你的分流策略永远保持最新，广告拦截库和国内白名单每日自动静默刷新！

---

## 五、常见高频问答 (FAQ)

### Q1：为什么规则匹配一定要把最具体的域名写在最上面，而把 `GEOIP,CN` 和 `MATCH` 放在最底部？
**答**：因为 Clash 的规则审查机制遵循**“从上到下一票制原则”**！
数据包进入规则引擎后，逐行往下核对。一旦命中任意一条规则，就会立刻按照该规则的出站方向将数据发出去，并且彻底终止后续所有规则的匹配！
如果你把宽泛的 `GEOIP,CN,DIRECT` 或者兜底的 `MATCH` 放在了第 1 行，后面的所有精细化流媒体和分流规则就永远没有机会被执行到了。所以规则顺序永远是：**广告拦截/特殊直连 -> 细分网站/流媒体 -> GEOIP,CN -> MATCH 兜底**。

### Q2：`type: url-test`（自动测速）和 `type: fallback`（故障转移）有什么区别？
**答**：
- **`url-test`（自动选最快）**：每隔一段时间（比如 300 秒）悄悄给列表里的所有节点测一次速，谁当前延迟最低，流量就自动切给谁。适合日常看网页刷视频；
- **`fallback`（健康故障备用）**：平时只死心塌地用第 1 个节点。只有当第 1 个节点彻底挂掉（断网宕机）时，才顺位切到第 2 个备用节点；一旦第 1 个节点复活，立刻切回。适合对 IP 稳定性要求极高、不能忍受频繁跳变 IP 的账号登录场景（如外贸或特定网银）。

### Q3：如何让我自己的私人公司内网或者私人 NAS 域名永远不走代理？
**答**：可以在规则列表最顶端加入一条带有 `DIRECT` 的域名后缀规则：
```yaml
rules:
  - DOMAIN-SUFFIX,mycompany.internal,DIRECT
  - DOMAIN-SUFFIX,mynas.xyz,DIRECT
  # 原有其他规则...
```
只要放在所有代理规则的前面，任何访问你的私有内网域名的请求就会瞬间被识别为直连，完全不走代理。

### Q4：为什么配置了 Rule Provider 之后，有时候客户端启动很慢？
**答**：如果你的 Rule Provider 引用的规则集下载地址在 GitHub 上，而你的本地网络直连 GitHub 速度很慢，就会导致客户端在启动时为了同步规则集而卡顿等待。
解决办法：在 `rule-providers` 的配置中，将原 GitHub 链接替换为经过国内 CDN 加速的镜像链接（例如使用 jsdelivr 镜像 `https://testingcf.jsdelivr.net/gh/...`），即可实现毫秒级快速加载。

## 📌 推荐延伸阅读与技术指南
- **博客精读版**：[Clash 规则分流与进阶策略组配置详解（博客版）](/article/clash-rules-guide/)
- **Verge配置**：[Clash Verge Rev 全平台安装与配置优化](/notes/clash/verge/)
- **排障指南**：[Clash 常见报错与排障大全](/notes/clash/faq/)
- **全平台总览**：[主流客户端配置指南](/article/client-guide/)
