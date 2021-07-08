import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { Tabs } from 'antd';
import { BellOutlined, DollarOutlined } from '@ant-design/icons';

import apis from 'apis';

import NotificationSettings from './NotificationSettings';
import PlatformFeesSettings from './PlatformFeesSettings';
import Loader from 'components/Loader';
import { showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

const { TabPane } = Tabs;

const AccountSettings = () => {
  const [accountSettings, setAccountSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getCreatorUserSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.user.getCreatorSettings();

      if (isAPISuccess(status) && data) {
        setAccountSettings(data);
      }
    } catch (error) {
      showErrorModal('Failed to fetch user account settings', error.response?.data?.message || 'Something went wrong');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    getCreatorUserSettings();
    //eslint-disable-next-line
  }, []);

  return (
    <div className={classNames(styles.box, styles.settingsWrapper)}>
      <Loader size="large" text="Fetching user account settings" loading={isLoading}>
        {accountSettings && (
          <Tabs size="large" defaultActiveKey="fees">
            <TabPane
              key="fees"
              tab={
                <div className={styles.largeTabHeader}>
                  <DollarOutlined />
                  Platform Fees
                </div>
              }
            >
              <PlatformFeesSettings fetchUserSettings={getCreatorUserSettings} accountSettings={accountSettings} />
            </TabPane>
            <TabPane
              key="notifications"
              tab={
                <div className={styles.largeTabHeader}>
                  <BellOutlined />
                  Email Alerts
                </div>
              }
            >
              <NotificationSettings fetchUserSettings={getCreatorUserSettings} checkedUserSettings={accountSettings} />
            </TabPane>
          </Tabs>
        )}
      </Loader>
    </div>
  );
};

export default AccountSettings;
