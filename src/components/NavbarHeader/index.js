import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { useHistory, useLocation } from 'react-router-dom';
import { Row, Col, Menu, Button, Typography, Modal } from 'antd';
import { MenuOutlined, VideoCameraAddOutlined, TeamOutlined } from '@ant-design/icons';

import Routes from 'routes';

import HeaderModal from 'components/HeaderModal';

import { getLocalUserDetails } from 'utils/storage';

import { useGlobalContext } from 'services/globalContext';
import { openFreshChatWidget } from 'services/integrations/fresh-chat';

import styles from './style.module.scss';

const { Text, Paragraph } = Typography;

const NavbarHeader = ({ removePadding = false }) => {
  const history = useHistory();
  const location = useLocation();

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

  const isCreatorCheck = () => {
    const userDetails = getLocalUserDetails();

    if (userDetails.is_creator) {
      history.push(Routes.creatorDashboard.rootPath);
    } else {
      Modal.confirm({
        autoFocusButton: 'cancel',
        centered: true,
        closable: true,
        maskClosable: true,
        content: (
          <>
            <Paragraph>Ready to become a host and start making money by hosting live events?</Paragraph>
            <Paragraph>
              By clicking on "<strong>Become Host</strong>" your account will be upgraded to a host account and you will
              get access to your dashboard and features empowering you to host live events on topics you are passionate
              about and make money from it.
            </Paragraph>
          </>
        ),
        title: 'Become a Host',
        okText: 'Become Host',
        cancelText: 'Talk to Us',
        onOk: () => history.push(Routes.profile),
        onCancel: () => openFreshChatWidget(),
      });
    }
  };

  const isActive = (path) => location.pathname.includes(path);

  const siteLinkActive = (section) => {
    if (location.state && location.pathname === Routes.root) {
      const sectionToShow = location.state.section;

      return section === sectionToShow;
    } else {
      return false;
    }
  };

  const inDashboard = () =>
    location.pathname.includes('/attendee/dashboard') || location.pathname.includes('/creator/dashboard');

  const redirectToCreatorProfile = (section) => {
    setShowMobileMenu(false);
    history.push(`${Routes.root}`, { section: section || 'home' });
  };

  const redirectToAttendeeDashboard = (subPage = Routes.attendeeDashboard.defaultPath) => {
    setShowMobileMenu(false);
    history.push(`${Routes.attendeeDashboard.rootPath}${subPage}`);
  };

  useEffect(() => {
    setLocalUserDetails(getLocalUserDetails());
  }, [userDetails]);

  useEffect(() => {
    //For some reason, sometimes the modals locks the scrolling of <body>
    //This line here is to remove the style element of <body>
    document.body.removeAttribute('style');
  }, []);

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
            <Col className={classNames(styles.domainNameWrapper, inDashboard() ? styles.dashboard : undefined)}>
              <div className={styles.siteHomeLink}>
                <span className={styles.creatorSiteName} onClick={() => redirectToCreatorProfile()}>
                  {username.toUpperCase()}
                </span>
              </div>
            </Col>
            {localUserDetails && inDashboard() && (
              <Col className={styles.modeSelectWrapper}>
                <span
                  className={classNames(
                    styles.ml10,
                    styles.navItem,
                    isActive(Routes.creatorDashboard.rootPath) ? styles.active : undefined
                  )}
                  onClick={() => isCreatorCheck()}
                >
                  <VideoCameraAddOutlined className={styles.navItemIcon} />
                  Hosting
                </span>
                <span
                  className={classNames(
                    styles.ml10,
                    styles.navItem,
                    isActive(Routes.attendeeDashboard.rootPath) ? styles.active : undefined
                  )}
                  onClick={() => history.push(Routes.attendeeDashboard.rootPath)}
                >
                  <TeamOutlined className={styles.navItemIcon} />
                  Attending
                </span>
              </Col>
            )}
            <Col className={styles.inlineMenu}>
              <Menu
                mode="horizontal"
                overflowedIndicator={<MenuOutlined className={styles.hamburgerMenu} />}
                className={styles.menuContainer}
              >
                <Menu.Item key="Home" onClick={() => redirectToCreatorProfile('home')}>
                  Site Home
                </Menu.Item>
                <Menu.Item
                  key="Session"
                  className={siteLinkActive('session') ? 'ant-menu-item-active' : undefined}
                  onClick={() => redirectToCreatorProfile('session')}
                >
                  Sessions
                </Menu.Item>
                <Menu.Item
                  key="Pass"
                  className={siteLinkActive('pass') ? 'ant-menu-item-active' : undefined}
                  onClick={() => redirectToCreatorProfile('pass')}
                >
                  Passes
                </Menu.Item>
                {/* <Menu.Item key="Videos" onClick={() => redirectToCreatorProfile('video')}> Videos </Menu.Item> */}
                {localUserDetails ? (
                  <>
                    <Menu.Item
                      key="Dashboard"
                      className={isActive('/attendee/dashboard') ? 'ant-menu-item-active' : undefined}
                      onClick={() => redirectToAttendeeDashboard()}
                    >
                      My Dashboard
                    </Menu.Item>
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
            <Col className={styles.mobileMenuContainer}>
              <span className={styles.mobileMenu}>
                <MenuOutlined size={50} onClick={() => setShowMobileMenu(true)} />
              </span>
              <Modal
                style={{ top: 0, margin: 0, maxWidth: '100vw' }}
                className={styles.mobileMenuModal}
                visible={showMobileMenu}
                footer={null}
                width="100vw"
                onCancel={() => {
                  setShowMobileMenu(false);
                  document.body.removeAttribute('style');
                }}
                onOk={() => {
                  setShowMobileMenu(false);
                  document.body.removeAttribute('style');
                }}
                afterClose={() => document.body.removeAttribute('style')}
              >
                <Row className={styles.topRow}>
                  <Col xs={20}>
                    <div className={styles.siteHomeLink}>
                      <span className={styles.creatorSiteName} onClick={() => redirectToCreatorProfile('home')}>
                        {username.toUpperCase()}
                      </span>
                    </div>
                  </Col>
                  <Col xs={4}></Col>
                </Row>
                <Row gutter={[8, 8]}>
                  <Col xs={24}>
                    <ul className={styles.menuLinks}>
                      {localUserDetails && inDashboard() && (
                        <li key="Mode Selection">
                          <Row gutter={[8, 8]}>
                            <Col xs={12}>
                              <span
                                className={classNames(
                                  styles.navItem,
                                  isActive(Routes.creatorDashboard.rootPath) ? styles.active : undefined
                                )}
                                onClick={() => isCreatorCheck()}
                              >
                                <VideoCameraAddOutlined className={styles.navItemIcon} />
                                Hosting
                              </span>
                            </Col>
                            <Col xs={12}>
                              <span
                                className={classNames(
                                  styles.navItem,
                                  isActive(Routes.attendeeDashboard.rootPath) ? styles.active : undefined
                                )}
                                onClick={() => history.push(Routes.attendeeDashboard.rootPath)}
                              >
                                <TeamOutlined className={styles.navItemIcon} />
                                Attending
                              </span>
                            </Col>
                          </Row>
                        </li>
                      )}
                      <li
                        key="Creator Home"
                        className={siteLinkActive('home') ? styles.active : undefined}
                        onClick={() => redirectToCreatorProfile('home')}
                      >
                        <span className={styles.menuLink}>Site Home</span>
                      </li>
                      <li
                        key="Creator Sessions"
                        className={siteLinkActive('session') ? styles.active : undefined}
                        onClick={() => redirectToCreatorProfile('session')}
                      >
                        <span className={styles.menuLink}>Sessions</span>
                      </li>
                      <li
                        key="Creator Passes"
                        className={siteLinkActive('pass') ? styles.active : undefined}
                        onClick={() => redirectToCreatorProfile('pass')}
                      >
                        <span className={styles.menuLink}>Passes</span>
                      </li>
                      {/* <li key="Creator Videos">
                        <span className={styles.menuLink} onClick={() => redirectToCreatorProfile('video')}>
                          {username.toUpperCase()} Videos
                        </span>
                      </li> */}

                      {localUserDetails && (
                        <>
                          <li key="Divider" className={styles.divider} />
                          <li
                            key="Attendee Upcoming Sessions"
                            className={isActive('/attendee/dashboard/sessions/upcoming') ? styles.active : undefined}
                            onClick={() => redirectToAttendeeDashboard('/sessions/upcoming')}
                          >
                            <span className={styles.menuLink}>My Upcoming Sessions</span>
                          </li>
                          <li
                            key="Attendee Past Sessions"
                            className={isActive('/attendee/dashboard/sessions/past') ? styles.active : undefined}
                            onClick={() => redirectToAttendeeDashboard('/sessions/past')}
                          >
                            <span className={styles.menuLink}>My Past Sessions</span>
                          </li>
                          <li
                            key="Attendee Passes"
                            className={isActive('/attendee/dashboard/passes') ? styles.active : undefined}
                            onClick={() => redirectToAttendeeDashboard(Routes.attendeeDashboard.passes)}
                          >
                            <span className={styles.menuLink}>My Passes</span>
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
                            <Button block type="primary" onClick={() => showSignInModal()}>
                              Sign In
                            </Button>
                          </Col>
                          <Col xs={12}>
                            <Button block type="default" onClick={() => showSignUpModal()}>
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
