function findSelectorAndAttachEvent(selector, eventName, eventCallBack) {
  const element = document.querySelectorAll(selector)[0];
  if (element) {
    element.addEventListener(eventName, eventCallBack);
  }
}

function openFreshChatWindow() {
  findSelectorAndAttachEvent("[data-talk-to-us-link='true']", 'click', function () {
    if (!window.fcWidget.isOpen()) {
      window.fcWidget.open();
    }
  });
}

openFreshChatWindow();
