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

  return (
    <Row className={styles.headerContainer}>
      <Col flex="auto">
        <img src={logo} alt="Passion.do" className={styles.logo} />
      </Col>
      <Col flex={isMobileDevice ? 'auto' : '300px'} className={isMobileDevice && styles.navItemWrapper}>
        <span
          className={classNames(styles.ml10, styles.navItem)}
          onClick={() => history.push(Routes.creatorDashboard.rootPath)}
        >
          <VideoCameraAddOutlined className={styles.navItemIcon} />
          Hosting
        </span>
        <span
          className={classNames(styles.ml10, styles.navItem)}
          onClick={() => history.push(Routes.attendeeDashboard.rootPath)}
        >
          <TeamOutlined className={styles.navItemIcon} />
          Attending
        </span>
        <Button type="text" onClick={() => logOut(history)}>
          Logout
        </Button>
      </Col>
    </Row>
  );
};

export default Header;
