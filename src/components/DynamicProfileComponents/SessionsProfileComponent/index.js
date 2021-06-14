import React from 'react';

import { Card, Typography } from 'antd';
import { VideoCameraTwoTone } from '@ant-design/icons';

import SessionListView from './SessionListView';

import styles from './style.module.scss';

const { Text } = Typography;

const DefaultContainerTitle = (
  <Text style={{ color: '#0050B3' }}>
    <VideoCameraTwoTone className={styles.mr10} twoToneColor="#0050B3" />
    SESSIONS
  </Text>
);

// TODO : Later we might want these colors to be customized
const cardHeadingStyle = {
  background: '#F1FBFF',
  boxShadow: 'inset 0px -1px 0px #E6F5FB',
  color: '#0050B3',
};

const SessionsProfileComponent = ({ title = DefaultContainerTitle }) => {
  return (
    <div className={styles.p10}>
      <Card
        title={title}
        headStyle={cardHeadingStyle}
        className={styles.sessionProfileComponentContainer}
        bodyStyle={{ padding: 12 }}
      >
        <SessionListView />
      </Card>
    </div>
  );
};

export default SessionsProfileComponent;
