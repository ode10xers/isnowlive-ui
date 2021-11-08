import React, { useEffect, useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import { message } from 'antd';

import Routes from 'routes';

import AuthModal from 'components/AuthModal';

import { isValidPostMessageEvent, postMessageToWindow } from 'utils/postMessage';
import { postMessageCommands } from 'utils/constants';

import { useGlobalContext } from 'services/globalContext';

const PostMessageHandlers = () => {
  const history = useHistory();
  const {
    state: { userDetails },
  } = useGlobalContext();

  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authModalCallback, setAuthModalCallback] = useState(() => () => {});

  const showAuthModal = () => {
    setAuthModalVisible(true);
  };

  const closeAuthModal = () => {
    setAuthModalVisible(false);
  };

  const redirectToDashboard = useCallback(() => {
    const user_type = userDetails?.is_creator ? 'creatorDashboard' : 'attendeeDashboard';
    const portalContainer = document.getElementById('page-portal');
    if (portalContainer) {
      portalContainer.remove();
    }

    history.push(`${Routes[user_type].rootPath}${Routes[user_type].defaultPath}`);
    // Currently simplest to open new tab
    // window.open(`${Routes[user_type].rootPath}${Routes[user_type].defaultPath}`);
  }, [userDetails, history]);

  const showLoginNotice = () => {
    message.success('You have logged in!');
  };

  const handleMessageEvent = useCallback(
    (msgEvent) => {
      if (!isValidPostMessageEvent(msgEvent)) {
        return;
      }

      const { command = '', details = null } = msgEvent.data;
      console.log(details);

      switch (command) {
        case `${postMessageCommands.ACTION.PREFIX}${postMessageCommands.ACTION.LOGIN_DASHBOARD}`:
          setAuthModalCallback(() => redirectToDashboard);
          showAuthModal();
          break;
        case `${postMessageCommands.ACTION.PREFIX}${postMessageCommands.ACTION.LOGIN_NOTICE}`:
          setAuthModalCallback(() => showLoginNotice);
          showAuthModal();
          break;
        default:
          return;
      }
    },
    [redirectToDashboard]
  );

  useEffect(() => {
    window.addEventListener('message', handleMessageEvent);
  }, [handleMessageEvent]);

  useEffect(() => {
    const command = postMessageCommands.RESPONSE.PREFIX + postMessageCommands.RESPONSE.USER_DETAILS;
    postMessageToWindow(command, userDetails);
  }, [userDetails]);

  return (
    <div>
      <AuthModal
        visible={authModalVisible}
        closeModal={closeAuthModal}
        onLoggedInCallback={authModalCallback ?? (() => {})}
      />
    </div>
  );
};

export default PostMessageHandlers;
