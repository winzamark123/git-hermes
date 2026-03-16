import yoctoSpinner, { type Color } from "yocto-spinner";

const ANSI_COLORS: Record<Color, string> = {
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

const DIM = "\x1b[90m";
const RESET = "\x1b[0m";

function karaokeFrame({ text, position, color }: { text: string; position: number; color: Color }) {
  const ansi = ANSI_COLORS[color];
  return `${ansi}${text.slice(0, position)}${RESET}${DIM}${text.slice(position)}${RESET}`;
}

export function createLoadingAnimation({ text, color = "cyan" }: { text: string; color?: Color }) {
  let position = 0;

  const spinner = yoctoSpinner({
    text: karaokeFrame({ text, position, color }),
    color,
  }).start();

  const interval = setInterval(() => {
    position = (position + 1) % (text.length + 1);
    spinner.text = karaokeFrame({ text, position, color });
  }, 60);

  return {
    success(successText?: string) {
      clearInterval(interval);
      spinner.success(successText);
    },
    error(errorText?: string) {
      clearInterval(interval);
      spinner.error(errorText);
    },
    stop() {
      clearInterval(interval);
      spinner.stop();
    },
  };
}
