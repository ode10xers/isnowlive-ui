import React, { useState, useEffect } from 'react';

import { Button } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';

import { getLocalUserDetails } from 'utils/storage';
import { isValidPostMessageEvent, postMessageToWindow } from 'utils/postMessage';
import { postMessageCommands } from 'utils/constants';

const SignInButton = ({ target = 'dashboard', buttonType = 'primary' }) => {
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    const userCreds = getLocalUserDetails();

    if (userCreds) {
      setUserDetails(userCreds);
    } else {
      window.addEventListener('message', (e) => {
        if (isValidPostMessageEvent(e)) {
          const { command = '', details = null } = e.data;

          if (
            command === `${postMessageCommands.RESPONSE.PREFIX}${postMessageCommands.RESPONSE.USER_DETAILS}` &&
            details
          ) {
            setUserDetails(details);
          }
        }
      });
    }
  }, []);

  const postLoginMessage = (redirect = false) => {
    const command =
      postMessageCommands.ACTION.PREFIX +
      (redirect ? postMessageCommands.ACTION.LOGIN_DASHBOARD : postMessageCommands.ACTION.LOGIN_NOTICE);
    postMessageToWindow(command);
  };

  return (
    <div>
      {userDetails ? (
        <Button
          ghost={buttonType === 'outlined'}
          type={buttonType === 'outlined' ? 'primary' : buttonType ?? 'primary'}
          onClick={() => postLoginMessage(true)}
          icon={<AppstoreOutlined />}
        >
          My Dashboard
        </Button>
      ) : (
        <Button
          ghost={buttonType === 'outlined'}
          type={buttonType === 'outlined' ? 'primary' : buttonType ?? 'primary'}
          onClick={() => postLoginMessage(target === 'dashboard')}
        >
          Sign In
        </Button>
      )}
    </div>
  );
};

export default SignInButton;
