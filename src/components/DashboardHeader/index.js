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
import { useTranslation } from 'react-i18next';

import styles from './style.module.scss';
import SelectLanguage from 'components/SelectLanguage';
const logo = require('assets/images/Logo-passion-transparent.png');

const { user, attendee } = mixPanelEventTags;
const { Paragraph } = Typography;

const DashboardHeader = () => {
  const { t: translate } = useTranslation();
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
            <Paragraph></Paragraph>
            <Paragraph>
              {translate('READY_TO_BECOME_HOST_TEXT1')}"<strong>{translate('BECOME_HOST')}</strong>"
            </Paragraph>
          </>
        ),
        title: translate('BECOME_A_HOST'),
        okText: translate('BECOME_HOST'),
        cancelText: translate('TALK_TO_US'),
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
          {translate('HOSTING')}
        </span>
        <span
          className={classNames(styles.ml10, styles.navItem, isActive(Routes.attendeeDashboard.rootPath))}
          onClick={() => trackAndNavigate(Routes.attendeeDashboard.rootPath, user.click.switchToAttendee)}
        >
          <TeamOutlined className={styles.navItemIcon} />
          {translate('ATTENDING')}
        </span>
        <SelectLanguage className={styles.selectLanguage} />
        <Button type="text" className={styles.logout} onClick={() => trackAndLogOut(user.click.logOut)}>
          {translate('LOGOUT')}
        </Button>
      </Col>
    </Row>
  );
};

export default DashboardHeader;
