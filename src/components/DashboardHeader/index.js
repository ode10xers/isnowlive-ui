import React from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Button } from 'antd';

import { useGlobalContext } from 'services/globalContext';
import { trackSimpleEvent, mixPanelEventTags } from 'services/integrations/mixpanel';
import { isMobileDevice } from 'utils/device';

import styles from './style.module.scss';
import DashboardToggle from 'components/DashboardToggle';
const logo = require('assets/images/Logo-passion-transparent.png');

const { user } = mixPanelEventTags;

const DashboardHeader = () => {
  const { logOut } = useGlobalContext();
  const history = useHistory();

  const trackAndLogOut = (eventTag) => {
    trackSimpleEvent(eventTag);
    logOut(history, true);
  };

  return (
    <Row className={styles.headerContainer} gutter={[20, 8]}>
      <Col flex={isMobileDevice ? 'auto' : '240px'} className={isMobileDevice && styles.logoWrapper}>
        <img src={logo} alt="Passion.do" className={styles.logo} />
      </Col>
      <Col flex="auto" className={isMobileDevice && styles.navItemWrapper}>
        <DashboardToggle />
        <Button type="text" className={styles.logout} onClick={() => trackAndLogOut(user.click.logOut)}>
          Logout
        </Button>
      </Col>
    </Row>
  );
};

export default DashboardHeader;
