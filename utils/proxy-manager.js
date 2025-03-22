const { SocksProxyAgent } = require('socks-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');
const config = require('./config');
const logger = require('./logger');

class ProxyManager {
    constructor() {
        this.proxyAgents = {};
    }

    async initialize() {
        // 先询问用户是否启用代理
        const useProxy = await config.askForProxyUsage();
        
        if (!useProxy) {
            logger.info('代理已禁用，所有请求将直连');
            return;
        }
        
        // 加载代理配置
        this.loadProxies();
    }

    loadProxies() {
        // 从config获取代理配置
        const proxies = config.loadProxies();
        
        // 遍历配置的代理
        for (const [email, proxyUrl] of Object.entries(proxies)) {
            if (!proxyUrl || typeof proxyUrl !== 'string') continue;
            
            try {
                let agent;
                
                // 根据代理URL前缀选择代理类型
                if (proxyUrl.startsWith('socks')) {
                    agent = new SocksProxyAgent(proxyUrl);
                    logger.info(`为账户 ${this._maskEmail(email)} 配置SOCKS5代理: ${this._maskProxyUrl(proxyUrl)}`);
                } else if (proxyUrl.startsWith('http')) {
                    agent = new HttpsProxyAgent(proxyUrl);
                    logger.info(`为账户 ${this._maskEmail(email)} 配置HTTP代理: ${this._maskProxyUrl(proxyUrl)}`);
                } else {
                    logger.warn(`账户 ${this._maskEmail(email)} 的代理URL格式无效: ${proxyUrl}`);
                    continue;
                }
                
                this.proxyAgents[email] = agent;
            } catch (error) {
                logger.error(`为账户 ${this._maskEmail(email)} 创建代理失败: ${error.message}`);
            }
        }
        
        logger.info(`代理管理器已加载 ${Object.keys(this.proxyAgents).length} 个代理配置`);
    }

    getProxyAgent(email) {
        // 如果代理被全局禁用，直接返回null
        if (!config.enableProxy) {
            return null;
        }
        return this.proxyAgents[email] || null;
    }

    // 掩盖邮箱中间部分，保留前3个字符和@后面的部分
    _maskEmail(email) {
        if (!email || typeof email !== 'string') return email;
        
        const atIndex = email.indexOf('@');
        if (atIndex <= 3) return email; // 邮箱太短，不做掩码
        
        const prefix = email.substring(0, 3);
        const suffix = email.substring(atIndex);
        return prefix + '***' + suffix;
    }

    // 掩盖代理URL中的用户名和密码
    _maskProxyUrl(url) {
        if (!url || typeof url !== 'string') return url;
        
        try {
            // 替换用户名密码部分，如果存在
            return url.replace(/\/\/(.*?)@/, '//***:***@');
        } catch (e) {
            return url;
        }
    }
}

module.exports = new ProxyManager(); 