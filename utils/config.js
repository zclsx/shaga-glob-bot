const fs = require('fs');
const path = require('path');
const readline = require('readline');

class Config {
    constructor() {
        this.API_BASE_URL = 'https://api-iowa.shaga.xyz';
        
        // 日志配置
        this.logging = {
            logToFile: true,
            logDir: 'logs',
            logLevel: 'info' // debug, info, warn, error
        };
        
        // 检查间隔（秒）
        this.checkInterval = 3600; // 默认每小时
        
        // 是否启用代理
        this.enableProxy = false;
        
        // Banner文本
        this.bannerText = `
  ▄████  ██▓     ▒█████   ▄▄▄▄          ██████  ██▓███   ██▓ ███▄    █  
 ██▒ ▀█▒▓██▒    ▒██▒  ██▒▓█████▄      ▒██    ▒ ▓██░  ██▒▓██▒ ██ ▀█   █  
▒██░▄▄▄░▒██░    ▒██░  ██▒▒██▒ ▄██     ░ ▓██▄   ▓██░ ██▓▒▒██▒▓██  ▀█ ██▒ 
░▓█  ██▓▒██░    ▒██   ██░▒██░█▀         ▒   ██▒▒██▄█▓▒ ▒░██░▓██▒  ▐▌██▒ 
░▒▓███▀▒░██████▒░ ████▓▒░░▓█  ▀█▓     ▒██████▒▒▒██▒ ░  ░░██░▒██░   ▓██░ 
 ░▒   ▒ ░ ▒░▓  ░░ ▒░▒░▒░ ░▒▓███▀▒     ▒ ▒▓▒ ▒ ░▒▓▒░ ░  ░░▓  ░ ▒░   ▒ ▒  
  ░   ░ ░ ░ ▒  ░  ░ ▒ ▒░ ▒░▒   ░      ░ ░▒  ░ ░░▒ ░      ▒ ░░ ░░   ░ ▒░ 
░ ░   ░   ░ ░   ░ ░ ░ ▒   ░    ░      ░  ░  ░  ░░        ▒ ░   ░   ░ ░  
      ░     ░  ░    ░ ░   ░                  ░           ░           ░  
                                 ░                                      
  █████                            █████           ███                   
 ░░███                            ░░███           ░░░                    
  ░███  ████████   █████ ███ █████ ░███   █████  ████   █████████████   
  ░███ ░░███░░███ ░░███ ░███░░███  ░███  ███░░  ░░███  ░░███░░███░░███  
  ░███  ░███ ░███  ░███ ░███ ░███  ░███ ░░█████  ░███   ░███ ░███ ░███  
  ░███  ░███ ░███  ░███ ░███ ░███  ░███  ░░░░███ ░███   ░███ ░███ ░███  
  █████ ████ █████ ░░████████░░████████ ██████  █████  █████░███ █████ 
 ░░░░░ ░░░░ ░░░░░   ░░░░░░░░  ░░░░░░░░ ░░░░░░  ░░░░░  ░░░░░ ░░░ ░░░░░  
 
 Twitter: @https://x.com/0xjiushi21
 GitHub: @https://github.com/zclsx
`;
    }

    async askForProxyUsage() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question('是否启用代理？(y/n): ', (answer) => {
                this.enableProxy = answer.toLowerCase() === 'y';
                rl.close();
                resolve(this.enableProxy);
            });
        });
    }

    // 从proxy.txt读取代理配置
    loadProxies() {
        const proxies = {};
        const proxyFilePath = path.join(process.cwd(), 'data', 'proxy.txt');
        
        // 检查文件是否存在
        if (!fs.existsSync(proxyFilePath)) {
            return proxies;
        }
        
        try {
            const lines = fs.readFileSync(proxyFilePath, 'utf8').split('\n');
            
            for (const line of lines) {
                // 跳过空行和注释
                if (!line.trim() || line.trim().startsWith('#')) continue;
                
                // 格式: email=proxy_url
                const parts = line.trim().split('=');
                if (parts.length !== 2) continue;
                
                const email = parts[0].trim();
                const proxyUrl = parts[1].trim();
                
                if (email && proxyUrl) {
                    proxies[email] = proxyUrl;
                }
            }
        } catch (error) {
            console.error(`读取代理配置失败: ${error.message}`);
        }
        
        return proxies;
    }

    // 检查data目录下的文件是否存在，如果不存在则创建示例文件
    checkAndCreateDataFiles() {
        const dataDir = path.join(process.cwd(), 'data');
        
        // 确保data目录存在
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // 检查并创建proxy.txt
        const proxyPath = path.join(dataDir, 'proxy.txt');
        if (!fs.existsSync(proxyPath)) {
            const proxyExample = 
`# 代理配置文件
# 格式: email=proxy_url
# 示例:
# example@gmail.com=socks5://127.0.0.1:1080
# example2@gmail.com=http://user:pass@127.0.0.1:8080`;
            fs.writeFileSync(proxyPath, proxyExample, 'utf8');
        }
        
        // 检查tokens.txt
        const tokensPath = path.join(dataDir, 'tokens.txt');
        if (!fs.existsSync(tokensPath)) {
            const tokensExample = '# 在此文件中每行添加一个JWT令牌';
            fs.writeFileSync(tokensPath, tokensExample, 'utf8');
        }
    }
}

module.exports = new Config(); 