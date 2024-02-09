import { L, LogLevel } from 'env';

// Now you can use the Logger class and LogLevel enum
export const logger = new L({
    logLevel: LogLevel.SOFT,
    enableTimestamp: true,
    timeZone: 'Europe/Berlin',
    dateFormat: 'en-US',
    showLogLevel: true,
    enableConsole: true,
    writeToFile: true,
    filePath: 'AUTO',
});

