// This function is to validate postMessage events from page builder pages
// which will have the origin the same as the site URL. For the postMessage
// related to plugin styling, it won't have this check
export const isValidPostMessageEvent = (msgEvent) => msgEvent.isTrusted && msgEvent.origin === window.location.origin;

export const postMessageToWindow = (command = '', data = null) => {
  if (command) {
    window.postMessage({
      command: command,
      details: data,
    });
  }
};
