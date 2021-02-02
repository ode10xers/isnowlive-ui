import React from 'react';
import classNames from 'classnames';
import { Row, Col, Button, Modal, Typography } from 'antd';
import { useHistory } from 'react-router-dom';
import { VideoCameraAddOutlined, TeamOutlined, CloseOutlined } from '@ant-design/icons';

import Routes from 'routes';
import { useGlobalContext } from 'services/globalContext';
import { trackSimpleEvent, mixPanelEventTags } from 'services/integrations/mixpanel';
import { openFreshChatWidget } from 'services/integrations/fresh-chat';
import { isMobileDevice } from 'utils/device';
import { getLocalUserDetails } from 'utils/storage';

import styles from './style.module.scss';
const logo = require('assets/images/Logo-passion-transparent.png');

const { user, attendee } = mixPanelEventTags;
const { Paragraph } = Typography;

const DashboardHeader = () => {
  const { logOut } = useGlobalContext();
  const history = useHistory();

  const isActive = (path) => {
    if (history.location.pathname.includes(path)) {
      return styles.isActiveNavItem;
    }
  };

  const isCreatorCheck = () => {
    const userDetails = getLocalUserDetails();

    if (userDetails.is_creator) {
      trackAndNavigate(Routes.creatorDashboard.rootPath, user.click.switchToCreator);
    } else {
      Modal.confirm({
        autoFocusButton: 'cancel',
        centered: true,
        closable: true,
        closeIcon: <CloseOutlined />,
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
        onOk: () => trackAndNavigate(Routes.profile, attendee.click.dashboard.becomeHost),
        onCancel: () => openFreshChatWidget(),
      });
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
          onClick={() => isCreatorCheck()}
        >
          <VideoCameraAddOutlined className={styles.navItemIcon} />
          Hosting
        </span>
        <span
          className={classNames(styles.ml10, styles.navItem, isActive(Routes.attendeeDashboard.rootPath))}
          onClick={() => trackAndNavigate(Routes.attendeeDashboard.rootPath, user.click.switchToAttendee)}
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

export default DashboardHeader;
