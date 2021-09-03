import React from 'react';
import { Row, Col } from 'antd';

import DashboardToggle from 'components/DashboardToggle';

import styles from './style.module.scss';

const logo = require('assets/images/passion-orange-logo.png');

const DashboardHeader = () => {
  return (
    <Row className={styles.headerContainer} gutter={[20, 8]}>
      <Col className={styles.logoWrapper}>
        <img src={logo} alt="Passion.do" className={styles.logo} />
      </Col>
      <Col className={styles.navItemWrapper}>
        <DashboardToggle />
      </Col>
    </Row>
  );
};

export default DashboardHeader;
