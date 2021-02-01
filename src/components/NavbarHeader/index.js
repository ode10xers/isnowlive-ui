import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Menu, Button, Typography } from 'antd';
import { MenuOutlined } from '@ant-design/icons';

import Routes from 'routes';

import HeaderModal from 'components/HeaderModal';

import { isMobileDevice } from 'utils/device';
import { getLocalUserDetails } from 'utils/storage';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Text } = Typography;

const NavbarHeader = () => {
  const history = useHistory();

  const [localUserDetails, setLocalUserDetails] = useState(getLocalUserDetails());
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authModalState, setAuthModalState] = useState('signIn');

  const {
    state: { userDetails },
    logOut,
  } = useGlobalContext();

  const showSignInModal = () => {
    setAuthModalState('signIn');
    setAuthModalVisible(true);
  };

  const showSignUpModal = () => {
    setAuthModalState('signUp');
    setAuthModalVisible(true);
  };

  const toggleAuthModalState = () => {
    if (authModalState === 'signIn') {
      setAuthModalState('signUp');
    } else {
      setAuthModalState('signIn');
    }
  };

  const redirectToCreatorProfile = (section = 'session') => {
    history.push(Routes.root, { section: section || 'session' });
  };

  const redirectToAttendeeDashboard = () => {
    history.push(Routes.attendeeDashboard.rootPath);
  };

  useEffect(() => {
    setLocalUserDetails(getLocalUserDetails());
  }, [userDetails]);

  const username = window.location.hostname.split('.')[0];

  if (username === 'app') {
    return null;
  }

  console.log(localUserDetails);

  return (
    <div className={styles.navbarWrapper}>
      <HeaderModal
        visible={!localUserDetails && authModalVisible}
        closeModal={() => setAuthModalVisible(false)}
        signingIn={authModalState === 'signIn'}
        toggleSigningIn={toggleAuthModalState}
      />
      <Row>
        <Col xs={0} md={4} xl={4}></Col>
        <Col xs={24} md={16} xl={16}>
          <Row>
            <Col flex="2 1 auto">
              <div className={styles.siteHomeLink}>
                <span className={styles.creatorSiteName} onClick={() => redirectToCreatorProfile('session')}>
                  VKM
                  {!isMobileDevice && <span className={styles.siteHomeText}> Site Home </span>}
                </span>
              </div>
            </Col>
            <Col flex="0 0 auto">
              <Menu
                mode="horizontal"
                overflowedIndicator={<MenuOutlined className={styles.hamburgerMenu} />}
                className={styles.menuContainer}
              >
                {isMobileDevice && (
                  <Menu.Item key="Home" onClick={() => redirectToCreatorProfile('session')}>
                    {' '}
                    Home{' '}
                  </Menu.Item>
                )}
                {localUserDetails && (
                  <Menu.Item key="Dashboard" onClick={() => redirectToAttendeeDashboard()}>
                    {' '}
                    My Dashboard{' '}
                  </Menu.Item>
                )}
                <Menu.Item key="Sessions" onClick={() => redirectToCreatorProfile('session')}>
                  {' '}
                  Sessions{' '}
                </Menu.Item>
                <Menu.Item key="Passes" onClick={() => redirectToCreatorProfile('pass')}>
                  {' '}
                  Passes{' '}
                </Menu.Item>
                {/* <Menu.Item key="Videos" onClick={() => redirectToCreatorProfile('video')}> Videos </Menu.Item> */}
                {localUserDetails ? (
                  <>
                    <Menu.Item key="UserName" disabled>
                      <Text> Hi, {localUserDetails.first_name} </Text>
                    </Menu.Item>
                    <Menu.Item key="SignOut">
                      <Button block danger type="default" size="large" onClick={() => logOut(history, true)}>
                        Sign Out
                      </Button>
                    </Menu.Item>
                  </>
                ) : (
                  <>
                    <Menu.Item key="SignIn">
                      <Button block type="default" size="large" onClick={() => showSignInModal()}>
                        Sign In
                      </Button>
                    </Menu.Item>
                    <Menu.Item key="SignUp">
                      <Button block type="primary" size="large" onClick={() => showSignUpModal()}>
                        Sign Up
                      </Button>
                    </Menu.Item>
                  </>
                )}
              </Menu>
            </Col>
          </Row>
        </Col>
        <Col xs={0} md={4} xl={4}></Col>
      </Row>
    </div>
  );
};

export default NavbarHeader;
