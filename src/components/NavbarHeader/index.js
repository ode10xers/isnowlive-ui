import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { useHistory, useLocation } from 'react-router-dom';
import { Row, Col, Menu, Button, Typography, Modal } from 'antd';
import { VideoCameraAddOutlined, TeamOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import HeaderModal from 'components/HeaderModal';

import { isMobileDevice } from 'utils/device';
import { getLocalUserDetails } from 'utils/storage';
import { isAPISuccess, reservedDomainName } from 'utils/helper';
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
  const [shouldShowPassLink, setShouldShowPassLink] = useState(false);
  const [shouldShowVideoLink, setShouldShowVideoLink] = useState(false);
  const [shouldShowCourseLink, setShouldShowCourseLink] = useState(false);

  const {
    state: { userDetails },
    logOut,
  } = useGlobalContext();

  const checkShouldShowPassLink = async (username) => {
    try {
      const { status, data } = await apis.passes.getPassesByUsername(username);

      if (isAPISuccess(status) && data) {
        setShouldShowPassLink(data.length > 0);
      }
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed to fetch pass for username');
    }
  };

  const checkShouldShowVideoLink = async (username) => {
    try {
      const { status, data } = await apis.videos.getVideosByUsername(username);

      if (isAPISuccess(status) && data) {
        setShouldShowVideoLink(data.length > 0);
      }
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed to fetch videos for username');
    }
  };

  const checkShouldShowCourseLink = async (username) => {
    try {
      const { status, data } = await apis.courses.getCoursesByUsername(username);

      if (isAPISuccess(status) && data) {
        setShouldShowCourseLink(data.length > 0);
      }
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed to fetch courses for username');
    }
  };

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

  const redirectToDashboard = (subPage = null) => {
    setShowMobileMenu(false);
    if (subPage) {
      history.push(`${Routes.attendeeDashboard.rootPath}${subPage}`);
    } else {
      const user_type = getLocalUserDetails().is_creator ? 'creatorDashboard' : 'attendeeDashboard';
      history.push(`${Routes[user_type].rootPath}${Routes[user_type].defaultPath}`);
    }
  };

  useEffect(() => {
    setLocalUserDetails(getLocalUserDetails());
  }, [userDetails]);

  const username = window.location.hostname.split('.')[0];

  useEffect(() => {
    //For some reason, sometimes the modals locks the scrolling of <body>
    //This line here is to remove the style element of <body>
    document.body.removeAttribute('style');

    if (username && !reservedDomainName.includes(username)) {
      checkShouldShowPassLink(username);
      checkShouldShowVideoLink(username);
      checkShouldShowCourseLink(username);
    }
  }, [username]);

  if (reservedDomainName.includes(username)) {
    return null;
  }

  //TODO: Investigate better solution for dynamic font size adjustment
  // Involves jquery: https://stackoverflow.com/questions/687998/auto-size-dynamic-text-to-fill-fixed-size-container?rq=1
  // Currently implemented (inelegant solution) : https://stackoverflow.com/a/56588899

  return (
    <div>
      <HeaderModal
        visible={!localUserDetails && authModalVisible}
        closeModal={() => setAuthModalVisible(false)}
        signingIn={authModalState === 'signIn'}
        toggleSigningIn={toggleAuthModalState}
      />
      <Row className={styles.navbarWrapper}>
        <Col xs={24}>
          <Row>
            <Col
              className={classNames(
                styles.domainNameWrapper,
                inDashboard() && !isMobileDevice ? styles.dashboard : undefined
              )}
            >
              <span
                className={classNames(
                  styles.creatorSiteName,
                  username.length >= 15 ? styles.textLength15 : username.length >= 9 ? styles.textLength9 : undefined
                )}
                onClick={() => redirectToCreatorProfile()}
              >
                {username.toUpperCase()}
              </span>
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
            <Col className={classNames(styles.inlineMenu, inDashboard() ? styles.dashboard : undefined)}>
              <Menu
                mode="horizontal"
                overflowedIndicator={
                  <Button ghost type="primary" className={styles.menuIndicator}>
                    {' '}
                    Menu{' '}
                  </Button>
                }
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
                {shouldShowPassLink && (
                  <Menu.Item
                    key="Pass"
                    className={siteLinkActive('pass') ? 'ant-menu-item-active' : undefined}
                    onClick={() => redirectToCreatorProfile('pass')}
                  >
                    Passes
                  </Menu.Item>
                )}
                {shouldShowVideoLink && (
                  <Menu.Item
                    key="Video"
                    className={siteLinkActive('video') ? 'ant-menu-item-active' : undefined}
                    onClick={() => redirectToCreatorProfile('video')}
                  >
                    Videos
                  </Menu.Item>
                )}
                {shouldShowCourseLink && (
                  <Menu.Item
                    key="Course"
                    className={siteLinkActive('course') ? 'ant-menu-item-active' : undefined}
                    onClick={() => redirectToCreatorProfile('course')}
                  >
                    Courses
                  </Menu.Item>
                )}
                {localUserDetails ? (
                  <>
                    <Menu.Item
                      key="Dashboard"
                      className={isActive('/attendee/dashboard') ? 'ant-menu-item-active' : undefined}
                      onClick={() => redirectToDashboard()}
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
                      <Button block type="primary" className={styles.lightRedBtn} onClick={() => showSignInModal()}>
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
              <Row gutter={8} justify="end">
                <Col>
                  <span className={styles.externalButtonWrapper}>
                    {localUserDetails ? (
                      inDashboard() ? (
                        <Button className={styles.orangeBtn} onClick={() => redirectToCreatorProfile('home')}>
                          Site Home
                        </Button>
                      ) : (
                        <Button className={styles.greenBtn} onClick={() => redirectToDashboard()}>
                          Dashboard
                        </Button>
                      )
                    ) : (
                      <Button className={styles.lightRedBtn} onClick={() => showSignInModal()}>
                        Sign In
                      </Button>
                    )}
                  </span>
                </Col>
                <Col>
                  <span className={styles.mobileMenu}>
                    <Button
                      ghost
                      type="primary"
                      className={styles.menuIndicator}
                      onClick={() => setShowMobileMenu(true)}
                    >
                      {' '}
                      Menu{' '}
                    </Button>
                  </span>
                </Col>
              </Row>
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
                      <span
                        className={classNames(
                          styles.creatorSiteName,
                          username.length >= 15
                            ? styles.textLength15
                            : username.length >= 9
                            ? styles.textLength9
                            : undefined
                        )}
                        onClick={() => redirectToCreatorProfile('home')}
                      >
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
                      {shouldShowPassLink && (
                        <li
                          key="Creator Passes"
                          className={siteLinkActive('pass') ? styles.active : undefined}
                          onClick={() => redirectToCreatorProfile('pass')}
                        >
                          <span className={styles.menuLink}>Passes</span>
                        </li>
                      )}
                      {shouldShowVideoLink && (
                        <li
                          key="Creator Videos"
                          className={siteLinkActive('video') ? styles.active : undefined}
                          onClick={() => redirectToCreatorProfile('video')}
                        >
                          <span className={styles.menuLink}>Videos</span>
                        </li>
                      )}
                      {shouldShowCourseLink && (
                        <li
                          key="Creator Courses"
                          className={siteLinkActive('course') ? styles.active : undefined}
                          onClick={() => redirectToCreatorProfile('course')}
                        >
                          <span className={styles.menuLink}>Courses</span>
                        </li>
                      )}
                      {localUserDetails && (
                        <>
                          <li key="Divider" className={styles.divider} />
                          <li
                            key="Attendee Upcoming Sessions"
                            className={isActive('/attendee/dashboard/sessions/upcoming') ? styles.active : undefined}
                            onClick={() => redirectToDashboard('/sessions/upcoming')}
                          >
                            <span className={styles.menuLink}>My Upcoming Sessions</span>
                          </li>
                          <li
                            key="Attendee Past Sessions"
                            className={isActive('/attendee/dashboard/sessions/past') ? styles.active : undefined}
                            onClick={() => redirectToDashboard('/sessions/past')}
                          >
                            <span className={styles.menuLink}>My Past Sessions</span>
                          </li>
                          <li
                            key="Attendee Passes"
                            className={isActive('/attendee/dashboard/passes') ? styles.active : undefined}
                            onClick={() => redirectToDashboard('/passes')}
                          >
                            <span className={styles.menuLink}>My Passes</span>
                          </li>
                          <li
                            key="Attendee Videos"
                            className={isActive('/attendee/dashboard/videos') ? styles.active : undefined}
                            onClick={() => redirectToDashboard('/videos')}
                          >
                            <span className={styles.menuLink}>My Videos</span>
                          </li>
                          <li
                            key="Attendee Courses"
                            className={isActive('/attendee/dashboard/courses') ? styles.active : undefined}
                            onClick={() => redirectToDashboard('/courses')}
                          >
                            <span className={styles.menuLink}>My Courses</span>
                          </li>
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
                            <Button
                              block
                              type="primary"
                              className={styles.lightRedBtn}
                              onClick={() => showSignInModal()}
                            >
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
      </Row>
    </div>
  );
};

export default NavbarHeader;
