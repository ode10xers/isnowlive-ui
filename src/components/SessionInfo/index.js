import React from 'react';
import { Row, Col, Button, Typography, List } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';

import { isValidFile } from 'utils/helper';
import { isMobileDevice } from 'utils/device';

import styles from './style.module.scss';

const { Text } = Typography;

const SessionInfo = ({ session }) => {
  const documentUrls = session?.document_urls?.filter((documentUrl) => documentUrl && isValidFile(documentUrl)) || [];

  return (
    <Row justify="space-between" gutter={[8, 16]}>
      {documentUrls.length > 0 && (
        <Col xs={24} lg={session?.is_course ? 16 : 8}>
          <Text className={styles.text} type="secondary">
            {!isMobileDevice && 'Session '}Pre-read file(s)
          </Text>
          <List
            size="small"
            dataSource={documentUrls}
            renderItem={(documentUrl) => (
              <List.Item>
                <Button
                  className={styles.downloadButton}
                  type="link"
                  icon={<FilePdfOutlined />}
                  onClick={() => window.open(documentUrl)}
                >
                  {documentUrl.split('_').slice(-1)[0] || 'Download'}
                </Button>
              </List.Item>
            )}
          />
        </Col>
      )}
    </Row>
  );
};

export default SessionInfo;
