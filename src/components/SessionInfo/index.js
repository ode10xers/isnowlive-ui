import React from 'react';
import { Row, Col, Button, Typography } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';

import styles from './style.module.scss';

const { Text } = Typography;

const SessionInfo = ({ session }) => {
  return (
    <Row justify="space-between">
      <Col xs={8} md={8}>
        <Text type="secondary">Session Type</Text> <br />
        <Text className={styles.subText} strong>
          {session?.group ? 'Group session' : '1-on-1 Session'}
        </Text>
      </Col>
      <Col xs={8} md={8}>
        <Text type="secondary">Price</Text>
        <br />
        <Text className={styles.subText} strong>
          {session?.price || 0} {session?.currency}
        </Text>
      </Col>
      <Col xs={8} md={8}>
        <Text type="secondary">Session Prerequisite</Text>
        <br />
        <Text className={styles.subText} strong>
          <Button className={styles.button} type="link" icon={<FilePdfOutlined />} size="middle">
            Download
          </Button>
        </Text>
      </Col>
    </Row>
  );
};

export default SessionInfo;
