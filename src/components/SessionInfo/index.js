import React from 'react';
import { Row, Col, Button, Typography } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';

import { isValidImage } from 'utils/helper';

import styles from './style.module.scss';

const { Text } = Typography;

const SessionInfo = ({ session }) => {
  return (
    <Row justify="space-between">
      <Col xs={8} md={8}>
        <Text className={styles.text} type="secondary">
          Session Type
        </Text>
        <Text className={styles.subText}>{session?.group ? 'Group session' : '1-on-1 Session'}</Text>
      </Col>
      <Col xs={8} md={8}>
        <Text className={styles.text} type="secondary">
          Price
        </Text>
        <Text className={styles.subText}>
          {session?.price || 0} {session?.currency}
        </Text>
      </Col>
      {session?.document_url && isValidImage(session?.document_url) && (
        <Col xs={8} md={8}>
          <Text className={styles.text} type="secondary">
            Session Prerequisite
          </Text>
          <Text className={styles.subText}>
            <Button
              className={styles.downloadButton}
              type="link"
              icon={<FilePdfOutlined />}
              size="middle"
              onClick={() => window.open(session?.document_url)}
            >
              Download
            </Button>
          </Text>
        </Col>
      )}
    </Row>
  );
};

export default SessionInfo;
