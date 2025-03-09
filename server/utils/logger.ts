/**
 * Enhanced logger with colors and formatting
 */

// ANSI color codes
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  // Text colors
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  // Background colors
  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m"
};

// Icons for different log types
const icons = {
  info: "ℹ️",
  success: "✅",
  warning: "⚠️",
  error: "❌",
  debug: "🔍",
  database: "🗄️",
  server: "🚀",
  github: "🐙",
  auth: "🔐",
  api: "🌐"
};

const timestamp = () => {
  const now = new Date();
  return `${colors.dim}[${now.toLocaleTimeString()}]${colors.reset}`;
};

export const logger = {
  info: (message: string) => {
    console.log(`${timestamp()} ${icons.info} ${colors.cyan}${message}${colors.reset}`);
  },

  success: (message: string) => {
    console.log(`${timestamp()} ${icons.success} ${colors.green}${message}${colors.reset}`);
  },

  warning: (message: string) => {
    console.warn(`${timestamp()} ${icons.warning} ${colors.yellow}${message}${colors.reset}`);
  },

  error: (message: string, error?: any) => {
    console.error(`${timestamp()} ${icons.error} ${colors.red}${message}${colors.reset}`);
    if (error) console.error(`${colors.dim}${error.stack || error}${colors.reset}`);
  },

  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`${timestamp()} ${icons.debug} ${colors.magenta}${message}${colors.reset}`);
      if (data) console.log(data);
    }
  },

  database: (message: string) => {
    console.log(`${timestamp()} ${icons.database} ${colors.blue}[DB]${colors.reset} ${message}`);
  },

  server: (message: string) => {
    console.log(`${timestamp()} ${icons.server} ${colors.green}[SERVER]${colors.reset} ${message}`);
  },

  github: (message: string) => {
    console.log(`${timestamp()} ${icons.github} ${colors.magenta}[GitHub]${colors.reset} ${message}`);
  },

  auth: (message: string) => {
    console.log(`${timestamp()} ${icons.auth} ${colors.cyan}[AUTH]${colors.reset} ${message}`);
  },

  api: (message: string, method: string, path: string, status?: number, duration?: number) => {
    const statusColor = status && status >= 400 ? colors.red : colors.green;
    const methodColor = method === 'GET' ? colors.cyan :
      method === 'POST' ? colors.green :
        method === 'PUT' ? colors.yellow :
          method === 'DELETE' ? colors.red :
            colors.blue;

    console.log(
      `${timestamp()} ${icons.api} ${methodColor}${method}${colors.reset} ${path} ` +
      `${status ? `${statusColor}${status}${colors.reset}` : ''} ` +
      `${duration ? `${colors.yellow}${duration}ms${colors.reset}` : ''}`
    );
  }
};

export default logger;
