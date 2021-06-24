import React from 'react';
import { Card, Typography, Row, Col } from 'antd';
import { PlayCircleTwoTone } from '@ant-design/icons';

import VideoListView from './VideoListView';
import VideoEditView from './VideoEditView';

import styles from './style.module.scss';

const { Text } = Typography;

const ContainerTitle = ({ title = 'SESSIONS' }) => (
  <Text style={{ color: '#0050B3' }}>
    <PlayCircleTwoTone className={styles.mr10} twoToneColor="#0050B3" />
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

const VideoProfileComponent = ({
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
        {isEditing ? (
          <Row justify="center" align="middle">
            <Col className={styles.textAlignCenter}>Uploaded videos that you have published will show up here</Col>
          </Row>
        ) : (
          <VideoListView />
        )}
      </Card>
      {isEditing && <VideoEditView configValues={customComponentProps} updateHandler={saveEditChanges} />}
    </div>
  );
};

export default VideoProfileComponent;
