import React from 'react';
import classNames from 'classnames';
import { Tabs } from 'antd';
import { BellOutlined } from '@ant-design/icons';

import NotificationSettings from './NotificationSettings';

import styles from './styles.module.scss';

const { TabPane } = Tabs;

const settingItems = [
  {
    key: 'notification',
    icon: <BellOutlined />,
    label: 'Notifications',
    content: <NotificationSettings />,
  },
];

const AccountSettings = () => {
  return (
    <div className={classNames(styles.box, styles.settingsWrapper)}>
      <Tabs size="large" defaultActiveKey={settingItems[0].key}>
        {settingItems.map((settingItem) => (
          <TabPane
            key={settingItem.key}
            tab={
              <div className={styles.largeTabHeader}>
                {settingItem.icon}
                {settingItem.label}
              </div>
            }
          >
            {settingItem.content}
          </TabPane>
        ))}
      </Tabs>
    </div>
  );
};

export default AccountSettings;
