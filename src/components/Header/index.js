import React from 'react';
import classNames from 'classnames';
import { Row, Col, Button } from 'antd';
import { useHistory } from 'react-router-dom';
import { VideoCameraAddOutlined, TeamOutlined } from '@ant-design/icons';

import Routes from 'routes';
import { useGlobalContext } from 'services/globalContext';
import { isMobileDevice } from 'utils/device';

import styles from './style.module.scss';
const logo = require('assets/images/Logo-passion-transparent.png');

const Header = () => {
  const { logOut } = useGlobalContext();
  const history = useHistory();

  const isActive = (path) => {
    if (history.location.pathname.includes(path)) {
      return styles.isActiveNavItem;
    }
  };

  return (
    <Row className={styles.headerContainer}>
      <Col flex="auto" className={isMobileDevice && styles.logoWrapper}>
        <img src={logo} alt="Passion.do" className={styles.logo} />
      </Col>
      <Col flex={isMobileDevice ? 'auto' : '400px'} className={isMobileDevice && styles.navItemWrapper}>
        <span
          className={classNames(styles.ml10, styles.navItem, isActive(Routes.creatorDashboard.rootPath))}
          onClick={() => history.push(Routes.creatorDashboard.rootPath)}
        >
          <VideoCameraAddOutlined className={styles.navItemIcon} />
          Hosting
        </span>
        <span
          className={classNames(styles.ml10, styles.navItem, isActive(Routes.attendeeDashboard.rootPath))}
          onClick={() => history.push(Routes.attendeeDashboard.rootPath)}
        >
          <TeamOutlined className={styles.navItemIcon} />
          Attending
        </span>
        <Button className={styles.logout} type="text" onClick={() => logOut(history)}>
          Logout
        </Button>
      </Col>
    </Row>
  );
};

export default Header;
