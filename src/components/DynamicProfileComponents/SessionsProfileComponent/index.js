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

// TODO: Create Edit Overlays (for editing/deleting)
const SessionsProfileComponent = ({
  identifier = null,
  isEditing = false,
  updateConfigHandler,
  removeComponentHandler,
  ...customComponentProps
}) => {
  const saveEditChanges = (newConfig) => updateConfigHandler(identifier, newConfig);
  const deleteComponent = () => removeComponentHandler(identifier);

  return (
    <div className={styles.p10}>
      <Card
        title={<ContainerTitle title={customComponentProps.title} />}
        headStyle={cardHeadingStyle}
        className={styles.profileComponentContainer}
        bodyStyle={{ padding: 12 }}
      >
        <SessionListView />
      </Card>
      {isEditing && (
        <SessionEditView
          configValues={customComponentProps}
          deleteHandler={deleteComponent}
          updateHandler={saveEditChanges}
        />
      )}
    </div>
  );
};

export default SessionsProfileComponent;
