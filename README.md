# Shaga GLOB 自动Spin机器人

这是一个用于自动执行GLOB平台每日Spin任务的工具，支持多账号和代理配置。
官网地址：
https://glob.shaga.xyz/?r=ju3gz6dL9S
## 联系方式

- Twitter: [@0xjiushi21](https://x.com/0xjiushi21)
- GitHub: [@zclsx](https://github.com/zclsx) 
## 功能特性

- ✅ 自动执行GLOB平台的Spin操作
- ✅ 支持多账号管理
- ✅ 支持SOCKS5和HTTP代理
- ✅ 每个账号可配置独立代理
- ✅ 日志系统（控制台输出和文件记录）
- ✅ 智能化敏感信息掩码
- ✅ 彩色命令行界面
- ✅ 可配置的检查间隔

## 目录结构

```
└── sha/
    ├── data/             # 数据文件目录
    │   ├── tokens.txt    # JWT令牌配置
    │   └── proxy.txt     # 代理配置
    ├── utils/            # 工具模块
    │   ├── config.js     # 配置管理
    │   ├── logger.js     # 日志系统
    │   └── proxy-manager.js # 代理管理
    ├── logs/             # 日志文件目录（自动创建）
    ├── spin.js           # 主程序
    ├── package.json      # 项目依赖
    └── README.md         # 说明文档
```

## 安装

1. 确保安装了Node.js环境
2. 克隆或下载本仓库
3. 进入项目目录，执行:
```bash
pnpm install
```

## 配置

### 1. JWT令牌配置
在`data/tokens.txt`文件中，每行添加一个GLOB JWT令牌:
```
eyJhbGciOiJIUzI1NiIsInR5...第一个JWT令牌...
eyJhbGciOiJIUzI1NiIsInR5...第二个JWT令牌...
```

### 2. 代理配置（可选）
在`data/proxy.txt`中配置代理，格式为`email=proxy_url`，每行一个:
```
example@gmail.com=socks5://127.0.0.1:1080
example2@gmail.com=http://user:pass@127.0.0.1:8080
```

## 使用方法

启动自动Spin机器人:
```bash
npm start
```

程序启动后会询问是否启用代理。选择"y"启用，选择"n"禁用。

然后程序将:
1. 读取所有配置的账号
2. 加载对应的代理配置（如果启用）
3. 立即检查所有账号的Spin状态
4. 自动执行可以Spin的账号
5. 显示下次可以Spin的倒计时
6. 按照配置的时间间隔定期检查

## 日志

日志文件将保存在`logs`目录中，格式为`glob-spin-YYYY-MM-DD.log`。

## 注意事项

- 确保你的JWT令牌有效
- 代理配置中的邮箱必须与JWT令牌中的邮箱匹配
- 程序运行期间不要关闭终端窗口

