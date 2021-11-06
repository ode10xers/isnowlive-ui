import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import { Button, message } from 'antd';

import Routes from 'routes';

import AuthModal from 'components/AuthModal';

import { getLocalUserDetails } from 'utils/storage';

const SignInButton = ({ target = 'dashboard', buttonType = 'primary' }) => {
  const history = useHistory();

  const [authModalVisible, setAuthModalVisible] = useState(false);

  const showAuthModal = () => {
    setAuthModalVisible(true);
  };

  const closeAuthModal = () => {
    setAuthModalVisible(false);
  };

  const redirectToDashboard = () => {
    const user_type = getLocalUserDetails()?.is_creator ? 'creatorDashboard' : 'attendeeDashboard';
    history.push(`${Routes[user_type].rootPath}${Routes[user_type].defaultPath}`);
  };

  const handleLoggedIn = () => {
    if (target === 'dashboard') {
      redirectToDashboard();
    } else {
      message.success('You are now logged in!');
    }
  };

  return (
    <div>
      <AuthModal visible={authModalVisible} closeModal={closeAuthModal} onLoggedInCallback={handleLoggedIn} />
      {getLocalUserDetails() ? (
        <Button type={buttonType ?? 'primary'} onClick={redirectToDashboard}>
          My Dashboard
        </Button>
      ) : (
        <Button type={buttonType ?? 'primary'} onClick={showAuthModal}>
          Sign In
        </Button>
      )}
    </div>
  );
};

export default SignInButton;
