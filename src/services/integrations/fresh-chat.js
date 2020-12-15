function initFreshChatWidget(userData = null) {
  let freshChatConfig = {
    token: 'a30f40c7-e40a-4a1f-ade9-c66ee65c372d',
    host: 'https://wchat.in.freshchat.com',
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
}

export const initializeFreshChat = (userData = null) => {
  const freshChatSDK = document.getElementById('freshchat-js-sdk');

  if (freshChatSDK) {
    initFreshChatWidget(userData);
  } else {
    let element = document.createElement('script');
    element.id = 'freshchat-js-sdk';
    element.async = !0;
    element.src = 'https://wchat.in.freshchat.com/js/widget.js';
    element.onload = () => {
      initFreshChatWidget(userData);
    };
    document.head.appendChild(element);
  }
};
