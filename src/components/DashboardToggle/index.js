import React from 'react';
import { useHistory } from 'react-router-dom';
import { Modal, Typography } from 'antd';
import { VideoCameraAddOutlined, TeamOutlined, CloseOutlined } from '@ant-design/icons';

import SwitchSelector from 'react-switch-selector';

import Routes from 'routes';

import { getLocalUserDetails } from 'utils/storage';

import { trackSimpleEvent, mixPanelEventTags } from 'services/integrations/mixpanel';
import { openFreshChatWidget } from 'services/integrations/fresh-chat';

import styles from './style.module.scss';

const { user, attendee } = mixPanelEventTags;
const { Paragraph } = Typography;

const switchSelectorProps = {
  border: '1px solid #52c41a',
  backgroundColor: '#fff',
  selectedBackgroundColor: '#52c41a',
};

const switchSelectorOptions = [
  {
    label: (
      <div className={styles.navSwitchItem}>
        <VideoCameraAddOutlined className={styles.navItemIcon} />
        Hosting
      </div>
    ),
    value: 'creator',
    selectedFontColor: '#fff',
  },
  {
    label: (
      <div className={styles.navSwitchItem}>
        <TeamOutlined className={styles.navItemIcon} />
        Attending
      </div>
    ),
    value: 'attendee',
    selectedFontColor: '#fff',
  },
];

const DashboardToggle = () => {
  const history = useHistory();

  const isInCreatorDashboard = () => window.location.pathname.includes('/creator');

  const isCreatorCheck = () => {
    const userDetails = getLocalUserDetails();

    if (userDetails.is_creator) {
      setTimeout(() => trackAndNavigate(Routes.creatorDashboard.rootPath, user.click.switchToCreator), 100);
      // setSelectedNavSwitchIndex(0);
    } else {
      Modal.confirm({
        autoFocusButton: 'cancel',
        centered: true,
        closable: true,
        maskClosable: true,
        closeIcon: <CloseOutlined />,
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
        onOk: () => {
          setTimeout(() => trackAndNavigate(Routes.profile, attendee.click.dashboard.becomeHost), 100);
        },
        onCancel: () => openFreshChatWidget(),
      });
    }
  };

  const trackAndNavigate = (destination, eventTag) => {
    trackSimpleEvent(eventTag);
    history.push(destination);
  };

  const handleNavSwitchChange = (value) => {
    if (value === 'creator' && !isInCreatorDashboard()) {
      isCreatorCheck();
    } else if (value === 'attendee') {
      // setSelectedNavSwitchIndex(1);
      setTimeout(() => trackAndNavigate(Routes.attendeeDashboard.rootPath, user.click.switchToAttendee), 100);
    }
  };

  return (
    <div className={styles.navSwitchWrapper}>
      <SwitchSelector
        onChange={handleNavSwitchChange}
        options={switchSelectorOptions}
        initialSelectedIndex={isInCreatorDashboard() ? 0 : 1}
        {...switchSelectorProps}
      />
    </div>
  );
};

export default DashboardToggle;
