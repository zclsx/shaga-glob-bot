const fs = require('fs');
const path = require('path');

// ANSI颜色代码
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

class Logger {
    constructor(options = {}) {
        this.options = {
            logToFile: true,
            logDir: 'logs',
            logLevel: 'info', // 'debug', 'info', 'warn', 'error'
            ...options
        };

        // 创建日志目录
        if (this.options.logToFile) {
            if (!fs.existsSync(this.options.logDir)) {
                fs.mkdirSync(this.options.logDir, { recursive: true });
            }
            
            // 创建当天的日志文件
            const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            this.logFile = path.join(this.options.logDir, `glob-spin-${date}.log`);
        }
    }

    _log(level, message, color = '') {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        // 控制台输出带颜色
        console.log(`${color}${formattedMessage}${colors.reset}`);
        
        // 写入文件（无颜色）
        if (this.options.logToFile) {
            fs.appendFileSync(this.logFile, formattedMessage + '\n', 'utf8');
        }
    }

    debug(message) {
        if (['debug'].includes(this.options.logLevel)) {
            this._log('debug', message, colors.blue);
        }
    }

    info(message) {
        if (['debug', 'info'].includes(this.options.logLevel)) {
            this._log('info', message, colors.green);
        }
    }

    warn(message) {
        if (['debug', 'info', 'warn'].includes(this.options.logLevel)) {
            this._log('warn', message, colors.yellow);
        }
    }

    error(message) {
        if (['debug', 'info', 'warn', 'error'].includes(this.options.logLevel)) {
            this._log('error', message, colors.red);
        }
    }

    success(message) {
        if (['debug', 'info'].includes(this.options.logLevel)) {
            this._log('success', message, colors.green);
        }
    }

    clearLine() {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
    }

    // 打印一个彩色的表格
    printTable(headers, rows) {
        // 计算每列的最大宽度，考虑中文字符
        const columnWidths = headers.map((header, index) => {
            const headerWidth = this._getStringWidth(header);
            const maxRowWidth = rows.reduce((max, row) => {
                const cellWidth = this._getStringWidth(String(row[index]));
                return Math.max(max, cellWidth);
            }, 0);
            return Math.max(headerWidth, maxRowWidth);
        });

        // 打印表头
        let headerRow = '┌';
        headers.forEach((_, index) => {
            headerRow += '─'.repeat(columnWidths[index] + 2) + '┬';
        });
        headerRow = headerRow.slice(0, -1) + '┐';
        console.log(colors.cyan + headerRow + colors.reset);

        // 打印列名
        let headerNames = '│';
        headers.forEach((header, index) => {
            headerNames += ' ' + this._padString(header, columnWidths[index]) + ' │';
        });
        console.log(colors.cyan + headerNames + colors.reset);

        // 打印分隔线
        let separatorRow = '├';
        headers.forEach((_, index) => {
            separatorRow += '─'.repeat(columnWidths[index] + 2) + '┼';
        });
        separatorRow = separatorRow.slice(0, -1) + '┤';
        console.log(colors.cyan + separatorRow + colors.reset);

        // 打印数据行
        rows.forEach(row => {
            let dataRow = '│';
            row.forEach((cell, index) => {
                dataRow += ' ' + this._padString(String(cell), columnWidths[index]) + ' │';
            });
            console.log(colors.cyan + dataRow + colors.reset);
        });

        // 打印底部
        let footerRow = '└';
        headers.forEach((_, index) => {
            footerRow += '─'.repeat(columnWidths[index] + 2) + '┴';
        });
        footerRow = footerRow.slice(0, -1) + '┘';
        console.log(colors.cyan + footerRow + colors.reset);
    }

    // 获取字符串宽度（考虑中文字符）
    _getStringWidth(str) {
        let width = 0;
        for (let i = 0; i < str.length; i++) {
            // 中文字符和其他全角字符通常占用两个字符宽度
            if (/[\u4e00-\u9fa5\uFF00-\uFFFF]/.test(str[i])) {
                width += 2;
            } else {
                width += 1;
            }
        }
        return width;
    }

    // 根据字符宽度进行填充
    _padString(str, width) {
        const strWidth = this._getStringWidth(str);
        if (strWidth >= width) {
            return str;
        }
        return str + ' '.repeat(width - strWidth);
    }

    // 打印漂亮的彩色banner
    printBanner(text) {
        const lines = text.split('\n');
        const maxLength = Math.max(...lines.map(line => this._getStringWidth(line)));
        
        console.log('\n' + colors.magenta + '╔' + '═'.repeat(maxLength + 2) + '╗' + colors.reset);
        
        lines.forEach(line => {
            console.log(colors.magenta + '║ ' + colors.bright + colors.cyan + this._padString(line, maxLength) + colors.reset + colors.magenta + ' ║' + colors.reset);
        });
        
        console.log(colors.magenta + '╚' + '═'.repeat(maxLength + 2) + '╝' + colors.reset + '\n');
    }
}

module.exports = new Logger(); 