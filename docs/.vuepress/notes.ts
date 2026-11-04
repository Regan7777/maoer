import { defineNotesConfig } from 'vuepress-theme-plume'

export const notes = defineNotesConfig({
  dir: 'notes',
  link: '/',
  notes: [
    {
      dir: 'cheping',
      link: '/notes/cheping/',
      sidebar: [
        {
          text: '测评知识',
          prefix: 'study',
          collapsed: false,
          items: [
            { text: '在线IP与网络测试工具', link: 'iptest.md' },
            { text: 'VPS行业黑话完全指南', link: 'vpscant.md' },
            { text: '网络线路解析与出海线路评测', link: 'networkanalysis.md' },
            { text: '如何判断网络服务线路类型 (IPLC/IEPL/BGP中转等)', link: 'networkselect.md' },
          ],
        },
        {
          text: '节点搭建',
          prefix: 'nodeConstruction',
          collapsed: false,
          items: [
            { text: '节点搭建板块说明', link: 'description.md' },
            { text: '1、网络通信的基本过程', link: 'node1.md' },
            { text: '2、如何绕过防火墙的拦截', link: 'node2.md' },
            { text: '3、shadowsocks协议搭建节点', link: 'node3.md' },
            { text: '4、trojan协议搭建节点', link: 'node4.md' },
            { text: '5、VMESS+WS+TLS+WEB搭建', link: 'node5.md' },
            { text: '6、VLESS+XTLS+回落搭建节点', link: 'node6.md' },
            { text: '7、影响节点速度的因素有哪些？', link: 'node7.md' },
            { text: '8、如何不花钱提升节点速度？', link: 'node8.md' },
          ],
        },
      ],
    },
    {
      dir: 'clash',
      link: '/notes/clash/',
      sidebar: [
        {
          text: 'Clash 教程专栏',
          collapsed: false,
          items: [
            { text: 'Clash 核心概念与版本演进', link: 'intro.md' },
            { text: 'Clash Verge Rev 安装与配置', link: 'verge.md' },
            { text: 'Mihomo Party 进阶教程', link: 'mihomo.md' },
            { text: 'Clash Mi (iOS / 多平台) 极简教程', link: 'clashmi.md' },
            { text: 'iOS Nextin（星拓）专属客户端指南', link: 'nextin.md' },
            { text: '小火箭 (Shadowrocket) 苹果 iOS 上手指南', link: 'shadowrocket.md' },
            { text: 'Windows 电脑端新手保姆级教程', link: 'windows.md' },
            { text: '安卓 (Android) 手机客户端配置指南', link: 'android.md' },
            { text: 'Linux 系统客户端与命令行配置教程', link: 'linux.md' },
            { text: '分流规则与配置进阶', link: 'config.md' },
            { text: '常见报错与网络排障', link: 'faq.md' },
          ],
        },
      ],
    },
  ],
})
