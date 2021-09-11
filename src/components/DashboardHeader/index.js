import React from 'react';
import { Row, Col, Button, Grid } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

import DashboardToggle from 'components/DashboardToggle';

import { generateUrlFromUsername } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';
import { useLocation } from 'react-router';

const logo = require('assets/images/passion-orange-logo.png');

const { useBreakpoint } = Grid;

const DashboardHeader = () => {
  const { xs } = useBreakpoint();
  const location = useLocation();

  const {
    state: {
      userDetails: { username },
    },
  } = useGlobalContext();

  const handleRedirectToPublicPage = () => {
    if (username) {
      window.open(generateUrlFromUsername(username));
    }
  };

  return (
    <Row className={styles.headerContainer} gutter={[20, 8]}>
      <Col className={styles.logoWrapper}>
        <img src={logo} alt="Passion.do" className={styles.logo} />
      </Col>
      <Col className={styles.navItemWrapper}>
        <DashboardToggle />
        {location.pathname.includes('attendee') ? null : xs ? (
          <Button
            ghost
            type="primary"
            className={styles.siteButton}
            onClick={handleRedirectToPublicPage}
            icon={<GlobalOutlined />}
          />
        ) : (
          <Button ghost type="primary" className={styles.siteButton} onClick={handleRedirectToPublicPage}>
            My Website
          </Button>
        )}
      </Col>
    </Row>
  );
};

export default DashboardHeader;
