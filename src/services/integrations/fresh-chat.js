import config from 'config';

export const setFreshChatWidgetVisibility = (visible = false) => {
  if (window.fcWidget && window.fcWidget.isInitialized()) {
    window.fcWidget.setConfig({
      headerProperty: {
        hideChatButton: !visible,
      },
      cssNames: {
        widget: 'custom_fc_frame',
      },
    });
  }
};

export const initFreshChatWidget = (userData = null) => {
  let freshChatConfig = {
    config: {
      headerProperty: {
        hideChatButton: true,
      },
      cssNames: {
        widget: 'custom_fc_frame',
      },
    },
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

export const initializeFreshChat = (userDetails = null, userConsent = false) => {
  const freshChatSDK = document.getElementById('freshchat-js-sdk');

  if (!freshChatSDK) {
    let element = document.createElement('script');
    element.id = 'freshchat-js-sdk';
    element.async = !0;
    element.src = `${config.freshChat.hostUrl}/js/widget.js`;
    element.onload = () => {
      if (userConsent) {
        initFreshChatWidget(userDetails);
      }
    };
    document.head.appendChild(element);
  }
};

export const openFreshChatWidget = () => {
  if (!window.fcWidget.isOpen()) {
    window.fcWidget.open();
  }
};
