import React from 'react';
import { Card, Typography } from 'antd';
import { VideoCameraTwoTone } from '@ant-design/icons';

import SessionListView from './SessionListView';
import SessionEditView from './SessionEditView';

import styles from './style.module.scss';

const { Text } = Typography;

const ContainerTitle = ({ title = 'SESSIONS' }) => (
  <Text style={{ color: '#0050B3' }}>
    <VideoCameraTwoTone className={styles.mr10} twoToneColor="#0050B3" />
    {title}
  </Text>
);

// TODO : Later we might want these colors to be customized
const cardHeadingStyle = {
  background: '#F1FBFF',
  boxShadow: 'inset 0px -1px 0px #E6F5FB',
  color: '#0050B3',
  borderRadius: '12px 12px 0 0',
};

const SessionsProfileComponent = ({
  identifier = null,
  isEditing = false,
  updateConfigHandler,
  ...customComponentProps
}) => {
  const saveEditChanges = (newConfig) => updateConfigHandler(identifier, newConfig);

  return (
    <div className={styles.p10}>
      <Card
        title={<ContainerTitle title={customComponentProps.title} />}
        headStyle={cardHeadingStyle}
        className={styles.profileComponentContainer}
        bodyStyle={{ padding: 12, position: 'relative' }}
      >
        <SessionListView />
        {isEditing && <div className={styles.clickDisableOverlay} />}
      </Card>
      {isEditing && <SessionEditView configValues={customComponentProps} updateHandler={saveEditChanges} />}
    </div>
  );
};

export default SessionsProfileComponent;
