import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { useHistory, useLocation } from 'react-router-dom';
import { Row, Col, Menu, Button, Typography, Modal } from 'antd';

import apis from 'apis';
import Routes from 'routes';

import AuthModal from 'components/AuthModal';
import DashboardToggle from 'components/DashboardToggle';
import { resetBodyStyle } from 'components/Modals/modals';

import { isMobileDevice } from 'utils/device';
import { getLocalUserDetails } from 'utils/storage';
import { getUsernameFromUrl, isAPISuccess, reservedDomainName } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const logo = require('assets/images/passion-orange-logo.png');

const { Text } = Typography;

const NavbarHeader = () => {
  const history = useHistory();
  const location = useLocation();

  const [localUserDetails, setLocalUserDetails] = useState(getLocalUserDetails());
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authModalState, setAuthModalState] = useState('signIn');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [shouldShowSessionLink, setShouldShowSessionLink] = useState(false);
  const [shouldShowPassLink, setShouldShowPassLink] = useState(false);
  const [shouldShowVideoLink, setShouldShowVideoLink] = useState(false);
  const [shouldShowCourseLink, setShouldShowCourseLink] = useState(false);
  const [shouldShowSubscriptionLink, setShouldShowSubscriptionLink] = useState(false);

  const {
    state: { userDetails },
    logOut,
  } = useGlobalContext();

  const checkShouldShowSessionLink = async () => {
    try {
      const { status, data } = await apis.user.getSessionsByUsername('upcoming');

      if (isAPISuccess(status) && data) {
        setShouldShowSessionLink(data.length > 0);
      }
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed to fetch upcoming session for creator');
    }
  };

  const checkShouldShowPassLink = async () => {
    try {
      const { status, data } = await apis.passes.getPassesByUsername();

      if (isAPISuccess(status) && data) {
        setShouldShowPassLink(data.length > 0);
      }
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed to fetch pass for creator');
    }
  };

  const checkShouldShowVideoLink = async () => {
    try {
      const { status, data } = await apis.videos.getVideosByUsername();

      if (isAPISuccess(status) && data) {
        setShouldShowVideoLink(data.length > 0);
      }
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed to fetch videos for creator');
    }
  };

  const checkShouldShowCourseLink = async () => {
    try {
      const { status, data } = await apis.courses.getCoursesByUsername();

      if (isAPISuccess(status) && data) {
        setShouldShowCourseLink(data.length > 0);
      }
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed to fetch courses for creator');
    }
  };

  const checkShouldShowSubscriptionLink = async () => {
    try {
      const { status, data } = await apis.subscriptions.getSubscriptionsByUsername();

      if (isAPISuccess(status) && data) {
        setShouldShowSubscriptionLink(data.length > 0);
      }
    } catch (error) {
      console.error(error.response?.data?.message || 'Failed to fetch memberships for creator');
    }
  };

  const showSignInModal = () => {
    setAuthModalState('signIn');
    setAuthModalVisible(true);
    setShowMobileMenu(false);
    resetBodyStyle();
  };

  const showSignUpModal = () => {
    setAuthModalState('signUp');
    setAuthModalVisible(true);
    setShowMobileMenu(false);
    resetBodyStyle();
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

  const redirectToDashboard = (subPage = null) => {
    setShowMobileMenu(false);
    if (subPage) {
      history.push(`${Routes.attendeeDashboard.rootPath}${subPage}`);
    } else {
      const user_type = getLocalUserDetails().is_creator ? 'creatorDashboard' : 'attendeeDashboard';
      history.push(`${Routes[user_type].rootPath}${Routes[user_type].defaultPath}`);
    }
  };

  const username = getUsernameFromUrl();

  useEffect(() => {
    //For some reason, sometimes the modals locks the scrolling of <body>
    //This line here is to remove the style element of <body>
    resetBodyStyle();
    setLocalUserDetails(getLocalUserDetails());

    if (username && !reservedDomainName.includes(username)) {
      checkShouldShowSessionLink();
      checkShouldShowPassLink();
      checkShouldShowVideoLink();
      checkShouldShowCourseLink();
      checkShouldShowSubscriptionLink();
    }
  }, [username, userDetails]);

  if (reservedDomainName.includes(username)) {
    return (
      <div>
        <img src={logo} alt="Passion.do" height="44px" />
      </div>
    );
  }

  //TODO: Investigate better solution for dynamic font size adjustment
  // Involves jquery: https://stackoverflow.com/questions/687998/auto-size-dynamic-text-to-fill-fixed-size-container?rq=1
  // Currently implemented (inelegant solution) : https://stackoverflow.com/a/56588899

  return (
    <div>
      <AuthModal
        visible={!localUserDetails && authModalVisible}
        closeModal={() => setAuthModalVisible(false)}
        showingSignIn={authModalState === 'signIn'}
        onLoggedInCallback={() => redirectToDashboard()}
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
                  username.length >= 15 ? styles.textLength15 : username.length >= 8 ? styles.textLength8 : undefined
                )}
                onClick={() => history.push(Routes.root)}
              >
                {username.toUpperCase()}
              </span>
            </Col>
            {localUserDetails && inDashboard() && (
              <Col className={styles.modeSelectWrapper}>
                <DashboardToggle />
              </Col>
            )}
            <Col className={classNames(styles.inlineMenu, inDashboard() ? styles.dashboard : undefined)}>
              <Menu
                mode="horizontal"
                className={styles.menuContainer}
                overflowedIndicator={
                  <Button ghost type="primary" className={styles.menuIndicator}>
                    Menu
                  </Button>
                }
              >
                <Menu.Item key="Home" onClick={() => history.push(Routes.root)}>
                  Site Home
                </Menu.Item>
                {shouldShowSessionLink && (
                  <Menu.Item
                    key="Session"
                    className={siteLinkActive('session') ? 'ant-menu-item-active' : undefined}
                    onClick={() => history.push(Routes.sessions)}
                  >
                    Sessions
                  </Menu.Item>
                )}
                {shouldShowPassLink && (
                  <Menu.Item
                    key="Pass"
                    className={siteLinkActive('pass') ? 'ant-menu-item-active' : undefined}
                    onClick={() => {
                      history.push(Routes.passes);
                    }}
                  >
                    Passes
                  </Menu.Item>
                )}
                {shouldShowVideoLink && (
                  <Menu.Item
                    key="Video"
                    className={siteLinkActive('video') ? 'ant-menu-item-active' : undefined}
                    onClick={() => history.push(Routes.videos)}
                  >
                    Videos
                  </Menu.Item>
                )}
                {shouldShowCourseLink && (
                  <Menu.Item
                    key="Course"
                    className={siteLinkActive('course') ? 'ant-menu-item-active' : undefined}
                    onClick={() => history.push(Routes.courses)}
                  >
                    Courses
                  </Menu.Item>
                )}
                {shouldShowSubscriptionLink && (
                  <Menu.Item
                    key="Membership"
                    className={siteLinkActive('membership') ? 'ant-menu-item-active' : undefined}
                    onClick={() => {
                      history.push(Routes.subscriptions);
                    }}
                  >
                    Memberships
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
                      <Text strong className={styles.loggedInUserName}>
                        Hi, {localUserDetails.first_name}
                      </Text>
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
                        <Button className={styles.orangeBtn} onClick={() => history.push(Routes.root)}>
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
                bodyStyle={{ backgroundColor: `var(--passion-profile-lightest-color, white)` }}
                className={styles.mobileMenuModal}
                visible={showMobileMenu}
                footer={null}
                width="100vw"
                onCancel={() => {
                  setShowMobileMenu(false);
                  resetBodyStyle();
                }}
                onOk={() => {
                  setShowMobileMenu(false);
                  resetBodyStyle();
                }}
                afterClose={resetBodyStyle}
              >
                <Row className={styles.topRow}>
                  <Col xs={20}>
                    <div className={styles.siteHomeLink}>
                      <span
                        className={classNames(
                          styles.creatorSiteName,
                          username.length >= 15
                            ? styles.textLength15
                            : username.length >= 8
                            ? styles.textLength8
                            : undefined
                        )}
                        onClick={() => {
                          history.push(Routes.root);
                          setShowMobileMenu(false);
                        }}
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
                        <li key="Mode Selection" className={styles.mobileToggleWrapper}>
                          <DashboardToggle />
                        </li>
                      )}
                      <li
                        key="Creator Home"
                        className={siteLinkActive('home') ? styles.active : undefined}
                        onClick={() => {
                          history.push(Routes.root);
                          setShowMobileMenu(false);
                        }}
                      >
                        <span className={styles.menuLink}>Site Home</span>
                      </li>
                      {shouldShowSessionLink && (
                        <li
                          key="Creator Sessions"
                          className={siteLinkActive('session') ? styles.active : undefined}
                          onClick={() => {
                            history.push(Routes.sessions);
                            setShowMobileMenu(false);
                          }}
                        >
                          <span className={styles.menuLink}>Sessions</span>
                        </li>
                      )}
                      {shouldShowPassLink && (
                        <li
                          key="Creator Passes"
                          className={siteLinkActive('pass') ? styles.active : undefined}
                          onClick={() => {
                            history.push(Routes.passes);
                            setShowMobileMenu(false);
                          }}
                        >
                          <span className={styles.menuLink}>Passes</span>
                        </li>
                      )}
                      {shouldShowVideoLink && (
                        <li
                          key="Creator Videos"
                          className={siteLinkActive('video') ? styles.active : undefined}
                          onClick={() => {
                            history.push(Routes.videos);
                            setShowMobileMenu(false);
                          }}
                        >
                          <span className={styles.menuLink}>Videos</span>
                        </li>
                      )}
                      {shouldShowCourseLink && (
                        <li
                          key="Creator Courses"
                          className={siteLinkActive('course') ? styles.active : undefined}
                          onClick={() => {
                            history.push(Routes.courses);
                            setShowMobileMenu(false);
                          }}
                        >
                          <span className={styles.menuLink}>Courses</span>
                        </li>
                      )}
                      {shouldShowSubscriptionLink && (
                        <li
                          key="Creator Memberships"
                          className={siteLinkActive('membership') ? styles.active : undefined}
                          onClick={() => {
                            history.push(Routes.subscriptions);
                            setShowMobileMenu(false);
                          }}
                        >
                          <span className={styles.menuLink}>Memberships</span>
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
                          <li
                            key="Attendee Subscriptions"
                            className={isActive('/attendee/dashboard/subscriptions') ? styles.active : undefined}
                            onClick={() => redirectToDashboard('/subscriptions')}
                          >
                            <span className={styles.menuLink}>My Memberships</span>
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
                            <Text strong className={styles.loggedInUsername}>
                              {' '}
                              Hi, {localUserDetails.first_name}{' '}
                            </Text>
                          </Col>
                          <Col xs={24}>
                            <Button block danger type="default" onClick={() => logOut(history)}>
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
                            <Button
                              className={styles.mobileSignUpBtn}
                              ghost
                              block
                              type="primary"
                              onClick={() => showSignUpModal()}
                            >
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
