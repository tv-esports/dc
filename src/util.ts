import { L, LogLevel } from 'env';

const Logger = new L({
    logLevel: LogLevel.SOFT,
    enableTimestamp: true,
    timeZone: 'Europe/Berlin',
    dateFormat: 'en-US',
    showLogLevel: true,
    enableConsole: true,
    writeToFile: false,
    filePath: 'AUTO',
});

export default Logger;