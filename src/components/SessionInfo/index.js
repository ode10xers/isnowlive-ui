import React from 'react';
import { Row, Col, Button, Typography, List, Popover } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';

import { isValidFile } from 'utils/helper';
import { isMobileDevice } from 'utils/device';

import styles from './style.module.scss';

const { Text } = Typography;

const SessionInfo = ({ session }) => {
  // TODO: Remove this once BE is implemented
  const tempDocumentUrls = [
    'https://dkfqbuenrrvge.cloudfront.net/document/V6bLQBuhqnHbFOnl_gdpr-for-dummies-beginners-guide-to-gdpr.pdf',
    'https://dkfqbuenrrvge.cloudfront.net/document/mF4Q3gD31JgQTEQx_gdpr-for-dummies-beginners-guide-to-gdpr.pdf',
  ];

  return (
    <Row justify="space-between" gutter={[8, 16]}>
      <Col xs={12} lg={8}>
        <Text className={styles.text} type="secondary">
          {!isMobileDevice && 'Session '}Type
        </Text>
        <Text className={styles.subText}>{session?.group ? 'Group' : '1-on-1'}</Text>
      </Col>
      {!session?.is_course && (
        <Col xs={12} lg={8}>
          <Text className={styles.text} type="secondary">
            Price
          </Text>
          <Text className={styles.subText}>
            {session?.price === 0 ? 'Free' : `${session?.price || 0} ${session?.currency.toUpperCase()}`}
          </Text>
        </Col>
      )}
      {/* {session?.document_url && isValidFile(session?.document_url) && (
        <Col xs={24} lg={session?.is_course ? 16 : 8}>
          <Text className={styles.text} type="secondary">
            {!isMobileDevice && 'Session '}Pre-read file
          </Text>
          <Button
            className={styles.downloadButton}
            type="link"
            icon={<FilePdfOutlined />}
            size="middle"
            onClick={() => window.open(session?.document_url)}
          >
            {session?.document_url.split('_').slice(-1)[0] || 'Download'}
          </Button>
        </Col>
      )} */}
      {tempDocumentUrls.length > 0 && (
        <Col xs={24} lg={session?.is_course ? 16 : 8}>
          <Text className={styles.text} type="secondary">
            {!isMobileDevice && 'Session '}Pre-read file(s)
          </Text>
          {tempDocumentUrls.length > 1 ? (
            <Popover
              title="Attached files"
              content={
                <List
                  size="small"
                  dataSource={tempDocumentUrls.filter((documentUrl) => isValidFile(documentUrl))}
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
              }
            >
              <Button type="link" className={styles.linkBtn}>
                {tempDocumentUrls.length} files
              </Button>
            </Popover>
          ) : (
            <Button
              className={styles.downloadButton}
              type="link"
              icon={<FilePdfOutlined />}
              onClick={() => window.open(tempDocumentUrls[0])}
            >
              {tempDocumentUrls[0].split('_').slice(-1)[0] || 'Download'}
            </Button>
          )}
        </Col>
      )}
    </Row>
  );
};

export default SessionInfo;
