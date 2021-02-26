import config from 'config';

export const initFreshChatWidget = (userData = null) => {
  let freshChatConfig = {
    token: config.freshChat.appToken,
    host: config.freshChat.hostUrl,
  };

  if (userData) {
    freshChatConfig = {
      ...freshChatConfig,
      externalId: userData.external_id,
      firstName: userData.first_name,
      lastName: userData.last_name,
      email: userData.email,
    };
  }

  window.fcWidget.init(freshChatConfig);
};

export const initializeFreshChat = () => {
  const freshChatSDK = document.getElementById('freshchat-js-sdk');

  if (!freshChatSDK) {
    let element = document.createElement('script');
    element.id = 'freshchat-js-sdk';
    element.async = !0;
    element.src = `${config.freshChat.hostUrl}/js/widget.js`;
    // element.onload = () => {
    //   initFreshChatWidget(userData);
    // };
    document.head.appendChild(element);
  }
};

export const openFreshChatWidget = () => {
  if (!window.fcWidget.isOpen()) {
    window.fcWidget.open();
  }
};
