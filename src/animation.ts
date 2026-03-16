import yoctoSpinner from "yocto-spinner";

const CYAN = "\x1b[36m";
const DIM = "\x1b[90m";
const RESET = "\x1b[0m";

function karaokeFrame({ text, position }: { text: string; position: number }) {
  return `${CYAN}${text.slice(0, position)}${RESET}${DIM}${text.slice(position)}${RESET}`;
}

export function createLoadingAnimation({ text }: { text: string }) {
  let position = 0;

  const spinner = yoctoSpinner({
    text: karaokeFrame({ text, position }),
    color: "cyan",
  }).start();

  const interval = setInterval(() => {
    position = (position + 1) % (text.length + 1);
    spinner.text = karaokeFrame({ text, position });
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
