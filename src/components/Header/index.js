import React from 'react';
import classNames from 'classnames';
import { Row, Col, Button } from 'antd';
import { useHistory } from 'react-router-dom';
import { VideoCameraAddOutlined, TeamOutlined } from '@ant-design/icons';

import Routes from 'routes';
import { useGlobalContext } from 'services/globalContext';
import { trackSimpleEvent, mixPanelEventTags } from 'services/integrations/mixpanel';
import { isMobileDevice } from 'utils/device';

import styles from './style.module.scss';
const logo = require('assets/images/Logo-passion-transparent.png');

const { user } = mixPanelEventTags;

const Header = () => {
  const { logOut } = useGlobalContext();
  const history = useHistory();

  const isActive = (path) => {
    if (history.location.pathname.includes(path)) {
      return styles.isActiveNavItem;
    }
  };

  const trackAndNavigate = (destination, eventTag) => {
    trackSimpleEvent(eventTag);
    history.push(destination);
  };

  const trackAndLogOut = (eventTag) => {
    trackSimpleEvent(eventTag);
    logOut(history);
  };

  return (
    <Row className={styles.headerContainer}>
      <Col flex="auto" className={isMobileDevice && styles.logoWrapper}>
        <img src={logo} alt="Passion.do" className={styles.logo} />
      </Col>
      <Col flex={isMobileDevice ? 'auto' : '400px'} className={isMobileDevice && styles.navItemWrapper}>
        <span
          className={classNames(styles.ml10, styles.navItem, isActive(Routes.creatorDashboard.rootPath))}
          onClick={() => trackAndNavigate(user.click.switchToCreator, Routes.creatorDashboard.rootPath)}
        >
          <VideoCameraAddOutlined className={styles.navItemIcon} />
          Hosting
        </span>
        <span
          className={classNames(styles.ml10, styles.navItem, isActive(Routes.attendeeDashboard.rootPath))}
          onClick={() => trackAndNavigate(user.click.switchToAttendee, Routes.attendeeDashboard.rootPath)}
        >
          <TeamOutlined className={styles.navItemIcon} />
          Attending
        </span>
        <Button type="text" className={styles.logout} onClick={() => trackAndLogOut(user.click.logOut)}>
          Logout
        </Button>
      </Col>
    </Row>
  );
};

export default Header;
