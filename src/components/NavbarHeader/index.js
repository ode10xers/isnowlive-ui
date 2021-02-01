import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Menu, Button, Typography, Modal } from 'antd';
import { MenuOutlined } from '@ant-design/icons';

import Routes from 'routes';

import HeaderModal from 'components/HeaderModal';

import { isMobileDevice } from 'utils/device';
import { getLocalUserDetails } from 'utils/storage';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Text } = Typography;

const NavbarHeader = ({ removePadding = false }) => {
  const history = useHistory();

  const [localUserDetails, setLocalUserDetails] = useState(getLocalUserDetails());
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authModalState, setAuthModalState] = useState('signIn');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
    setShowMobileMenu(false);
    history.push(Routes.root, { section: section || 'session' });
  };

  const redirectToAttendeeDashboard = (subPage = Routes.attendeeDashboard.defaultPath) => {
    setShowMobileMenu(false);
    history.push(`${Routes.attendeeDashboard.rootPath}${subPage}`);
  };

  useEffect(() => {
    setLocalUserDetails(getLocalUserDetails());
  }, [userDetails]);

  const username = window.location.hostname.split('.')[0];

  if (username === 'app') {
    return null;
  }

  return (
    <div className={styles.navbarWrapper}>
      <HeaderModal
        visible={!localUserDetails && authModalVisible}
        closeModal={() => setAuthModalVisible(false)}
        signingIn={authModalState === 'signIn'}
        toggleSigningIn={toggleAuthModalState}
      />
      <Row>
        <Col xs={0} md={removePadding ? 0 : 4} xl={removePadding ? 0 : 4}></Col>
        <Col xs={24} md={removePadding ? 24 : 16} xl={removePadding ? 24 : 16}>
          <Row>
            <Col flex="3 1 auto">
              <div className={styles.siteHomeLink}>
                <span className={styles.creatorSiteName} onClick={() => redirectToCreatorProfile('session')}>
                  {username.toUpperCase()}
                  {!isMobileDevice && <span className={styles.siteHomeText}> Site Home </span>}
                </span>
              </div>
            </Col>
            <Col flex="0 0 auto" className={styles.inlineMenu}>
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
                      <Text strong> Hi, {localUserDetails.first_name} </Text>
                    </Menu.Item>
                    <Menu.Item key="SignOut">
                      <Button block danger type="default" onClick={() => logOut(history, true)}>
                        Sign Out
                      </Button>
                    </Menu.Item>
                  </>
                ) : (
                  <>
                    <Menu.Item key="SignIn">
                      <Button block type="default" onClick={() => showSignInModal()}>
                        Sign In
                      </Button>
                    </Menu.Item>
                    <Menu.Item key="SignUp">
                      <Button block type="primary" onClick={() => showSignUpModal()}>
                        Sign Up
                      </Button>
                    </Menu.Item>
                  </>
                )}
              </Menu>
            </Col>
            <Col flex="1 0 auto" className={styles.mobileMenuContainer}>
              <span className={styles.mobileMenu}>
                <MenuOutlined size={50} onClick={() => setShowMobileMenu(true)} />
              </span>
              <Modal
                style={{ top: 0, margin: 0, maxWidth: '100vw' }}
                className={styles.mobileMenuModal}
                visible={showMobileMenu}
                footer={null}
                width="100vw"
                onCancel={() => setShowMobileMenu(false)}
                onOk={() => setShowMobileMenu(false)}
              >
                <Row className={styles.topRow}>
                  <Col xs={10}>
                    <div className={styles.siteHomeLink}>
                      <span className={styles.creatorSiteName} onClick={() => redirectToCreatorProfile('session')}>
                        {username.toUpperCase()}
                      </span>
                    </div>
                  </Col>
                  <Col xs={12}></Col>
                </Row>
                <Row gutter={[8, 8]}>
                  <Col xs={24}>
                    <ul className={styles.menuLinks}>
                      <li key="Creator Home">
                        <span className={styles.menuLink} onClick={() => redirectToCreatorProfile('session')}>
                          {username.toUpperCase()} Home
                        </span>
                      </li>
                      <li key="Creator Sessions">
                        <span className={styles.menuLink} onClick={() => redirectToCreatorProfile('session')}>
                          {username.toUpperCase()} Sessions
                        </span>
                      </li>
                      <li key="Creator Passes" className={styles.noBorder}>
                        <span className={styles.menuLink} onClick={() => redirectToCreatorProfile('pass')}>
                          {username.toUpperCase()} Passes
                        </span>
                      </li>
                      {/* <li key="Creator Videos">
                        <span className={styles.menuLink} onClick={() => redirectToCreatorProfile('video')}>
                          {username.toUpperCase()} Videos
                        </span>
                      </li> */}

                      {localUserDetails && (
                        <>
                          <li key="Divider" className={styles.divider} />
                          <li key="Attendee Upcoming Sessions">
                            <span
                              className={styles.menuLink}
                              onClick={() => redirectToAttendeeDashboard('/sessions/upcoming')}
                            >
                              My Upcoming Sessions
                            </span>
                          </li>
                          <li key="Attendee Past Sessions">
                            <span
                              className={styles.menuLink}
                              onClick={() => redirectToAttendeeDashboard('/sessions/past')}
                            >
                              My Past Sessions
                            </span>
                          </li>
                          <li key="Attendee Passes" className={styles.noBorder}>
                            <span
                              className={styles.menuLink}
                              onClick={() => redirectToAttendeeDashboard(Routes.attendeeDashboard.passes)}
                            >
                              My Passes
                            </span>
                          </li>
                          {/* <li key="Attendee Videos">
                            <span className={styles.menuLink} onClick={() => redirectToAttendeeDashboard(Routes.attendeeDashboard.videos)}>
                              My Videos
                            </span>
                          </li> */}
                        </>
                      )}
                    </ul>
                  </Col>
                  <Col xs={24}>
                    <Row gutter={[8, 8]}>
                      {localUserDetails ? (
                        <>
                          <Col xs={24}>
                            <Text strong> Hi, {localUserDetails.first_name} </Text>
                          </Col>
                          <Col xs={24}>
                            <Button block danger type="default" onClick={() => logOut(history, true)}>
                              Sign Out
                            </Button>
                          </Col>
                        </>
                      ) : (
                        <>
                          <Col xs={12}>
                            <Button block type="default" onClick={() => showSignInModal()}>
                              Sign In
                            </Button>
                          </Col>
                          <Col xs={12}>
                            <Button block type="primary" onClick={() => showSignUpModal()}>
                              Sign Up
                            </Button>
                          </Col>
                        </>
                      )}
                    </Row>
                  </Col>
                </Row>
              </Modal>
            </Col>
          </Row>
        </Col>
        <Col xs={0} md={removePadding ? 0 : 4} xl={removePadding ? 0 : 4}></Col>
      </Row>
    </div>
  );
};

export default NavbarHeader;
