import React from 'react';
import { useLocation } from 'react-router';

import { Row, Col, Button, Grid } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

import Routes from 'routes';

import DashboardToggle from 'components/DashboardToggle';

import { generateUrlFromUsername } from 'utils/url';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const logo = require('assets/images/passion-orange-logo.png');

const { useBreakpoint } = Grid;

const DashboardHeader = () => {
  const { xs } = useBreakpoint();
  const location = useLocation();

  const isAttendeeDashboard = location.pathname.includes(Routes.attendeeDashboard.rootPath);

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
        <img loading="lazy" src={logo} alt="Passion.do" className={styles.logo} />
      </Col>
      <Col className={styles.navItemWrapper}>
        <DashboardToggle />
        {isAttendeeDashboard ? null : xs ? (
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
