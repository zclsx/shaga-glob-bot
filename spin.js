const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cron = require('node-cron');
const config = require('./utils/config');
const logger = require('./utils/logger');
const proxyManager = require('./utils/proxy-manager');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

class AutoSpinBot {
    constructor() {
        this.API_BASE_URL = config.API_BASE_URL;
        this.accounts = [];
        this.countdowns = {};
    }

    async initialize() {
        try {
            // 确保data目录和文件存在
            config.checkAndCreateDataFiles();
            
            // 从data目录读取tokens文件
            const tokensPath = path.join(process.cwd(), 'data', 'tokens.txt');
            const tokens = fs.readFileSync(tokensPath, 'utf8')
                .split('\n')
                .filter(token => token.trim() !== '' && !token.trim().startsWith('#'));

            for (const token of tokens) {
                try {
                    const tokenPayload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
                    this.accounts.push({
                        token: token.trim(),
                        uid: tokenPayload.sub,
                        email: tokenPayload.email
                    });
                } catch (error) {
                    logger.error(`解析token失败: ${error.message}`);
                }
            }

            logger.success(`Bot初始化成功，已加载 ${this.accounts.length} 个账户`);
            this.displayAccountsTable();
        } catch (error) {
            logger.error(`Bot初始化失败: ${error.message}`);
            process.exit(1);
        }
    }

    displayAccountsTable() {
        const headers = ['序号', '邮箱', '用户ID', '代理状态'];
        const rows = this.accounts.map((account, index) => {
            // 获取代理状态
            const hasProxy = proxyManager.getProxyAgent(account.email) ? '已配置' : '未配置';
            // 掩盖邮箱
            const maskedEmail = this._maskEmail(account.email);
            // 掩盖uid，只显示前6位和后4位
            const maskedUid = this._maskUid(account.uid);
            
            return [
                (index + 1).toString(),
                maskedEmail,
                maskedUid,
                hasProxy
            ];
        });

        logger.printTable(headers, rows);
    }

    _maskEmail(email) {
        const atIndex = email.indexOf('@');
        if (atIndex <= 3) return email;
        
        const prefix = email.substring(0, 3);
        const suffix = email.substring(atIndex);
        return prefix + '***' + suffix;
    }

    _maskUid(uid) {
        if (!uid || uid.length <= 10) return uid;
        return uid.substring(0, 6) + '...' + uid.substring(uid.length - 4);
    }

    async checkCanSpin(account) {
        try {
            // 获取账户的代理
            const proxyAgent = proxyManager.getProxyAgent(account.email);
            const axiosConfig = {
                headers: {
                    'authorization': `Bearer ${account.token}`,
                    'accept': 'application/json',
                    'origin': 'https://glob.shaga.xyz',
                    'referer': 'https://glob.shaga.xyz/'
                }
            };
            
            // 如果有代理，添加到配置中
            if (proxyAgent) {
                axiosConfig.httpsAgent = proxyAgent;
            }
            
            const response = await axios.get(`${this.API_BASE_URL}/quests/can-spin`, axiosConfig);
            return response.data;
        } catch (error) {
            logger.error(`检查账户 ${this._maskEmail(account.email)} 的Spin状态失败: ${error.message}`);
            return null;
        }
    }

    async performSpin(account) {
        try {
            // 获取账户的代理
            const proxyAgent = proxyManager.getProxyAgent(account.email);
            const axiosConfig = {
                headers: {
                    'authorization': `Bearer ${account.token}`,
                    'accept': 'application/json',
                    'content-type': 'application/json',
                    'origin': 'https://glob.shaga.xyz',
                    'referer': 'https://glob.shaga.xyz/'
                }
            };
            
            // 如果有代理，添加到配置中
            if (proxyAgent) {
                axiosConfig.httpsAgent = proxyAgent;
            }
            
            const response = await axios.post(
                `${this.API_BASE_URL}/quests/spin`,
                { uid: account.uid },
                axiosConfig
            );
            return response.data;
        } catch (error) {
            if (error.response && error.response.data) {
                return error.response.data;
            }
            logger.error(`账户 ${this._maskEmail(account.email)} 执行Spin失败: ${error.message}`);
            return null;
        }
    }

    formatTimeRemaining(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    async checkAndSpin(account) {
        const spinStatus = await this.checkCanSpin(account);
        
        if (!spinStatus) {
            return;
        }

        if (spinStatus.canSpin) {
            if (this.countdowns[account.uid]) {
                clearInterval(this.countdowns[account.uid]);
                delete this.countdowns[account.uid];
                logger.clearLine();
            }

            logger.info(`账户 ${this._maskEmail(account.email)} 正在执行Spin...`);
            const spinResult = await this.performSpin(account);
            
            if (spinResult) {
                if (spinResult.message === "Cooldown period not over yet") {
                    logger.warn(`账户 ${this._maskEmail(account.email)} ${spinResult.message}`);
                    this.startCountdown(account, spinResult.nextSpinDurationMs);
                } else {
                    logger.success(`账户 ${this._maskEmail(account.email)} Spin成功！`);
                    
                    // 输出Spin结果详情
                    if (spinResult.rewards) {
                        logger.info(`账户 ${this._maskEmail(account.email)} 获得奖励: ${JSON.stringify(spinResult.rewards)}`);
                    }
                }
            } else {
                logger.error(`账户 ${this._maskEmail(account.email)} Spin失败`);
            }
        } else {
            this.startCountdown(account, spinStatus.nextSpinDurationMs);
        }
    }

    startCountdown(account, duration) {
        if (this.countdowns[account.uid]) {
            return;
        }

        const updateInterval = setInterval(() => {
            logger.clearLine();
            process.stdout.write(
                `账户 ${this._maskEmail(account.email)} 下次Spin倒计时: ${this.formatTimeRemaining(duration)}`
            );
            
            duration -= 1000;
            if (duration <= 0) {
                clearInterval(updateInterval);
                delete this.countdowns[account.uid];
                this.checkAndSpin(account);
            }
        }, 1000);

        this.countdowns[account.uid] = updateInterval;
    }

    async checkAllAccounts() {
        logger.info(`开始检查所有账户...`);
        await Promise.all(this.accounts.map(account => this.checkAndSpin(account)));
    }

    start() {
        logger.success(`Bot已启动`);
        
        // 立即运行一次
        this.checkAllAccounts();

        // 根据配置的时间间隔定时运行
        const interval = config.checkInterval || 3600; // 默认1小时
        cron.schedule(`*/${Math.floor(interval / 60)} * * * *`, () => {
            this.checkAllAccounts();
        });

        logger.info(`Bot将每 ${Math.floor(interval / 60)} 分钟检查一次所有账户`);
    }
}

// 启动Bot
async function main() {
    // 显示Banner
    logger.printBanner(config.bannerText);
    
    logger.info('GLOB Auto Spin Bot | 初始化中...');
    
    // 初始化代理管理器
    await proxyManager.initialize();
    
    const bot = new AutoSpinBot();
    await bot.initialize();
    bot.start();
}

main().catch(error => {
    logger.error(`程序异常: ${error.message}`);
    process.exit(1);
});