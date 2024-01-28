import { green, yellow, red, magenta, cyan } from "chalk";

interface LoggerType {
  success: (message: string) => void;
  error: (message: string) => void;
  debug: (message: string) => void;
  warn: (message: string) => void;
  info: (message: string) => void;
}

class Logger implements LoggerType {
  public success = (message: string): void =>
    console.log(`${green("✔ Success:")} ${message}`);
  public error = (message: string): void =>
    console.log(`${red("✖ Error:")} ${message}`);
  public debug = (message: string): void =>
    console.log(`${magenta("◉ Debug:")} ${message}`);
  public warn = (message: string): void =>
    console.log(`${yellow("⚠ Warn:")} ${message}`);
  public info = (message: string): void =>
    console.log(`${cyan("ℹ Info:")} ${message}`);
}

export default Logger;