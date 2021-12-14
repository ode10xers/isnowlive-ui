import React from 'react';
import { Row, Col, Button, Typography, Grid, List } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';

import { isValidFile, isInCreatorDashboard } from 'utils/helper';

import styles from './style.module.scss';

const { useBreakpoint } = Grid;
const { Text } = Typography;

const SessionInfo = ({ session }) => {
  const { lg } = useBreakpoint();
  const documentUrls = session?.document_urls?.filter((documentUrl) => documentUrl && isValidFile(documentUrl)) || [];

  const renderSessionPrice = () => {
    if (isInCreatorDashboard()) {
      return session?.pay_what_you_want
        ? 'Your Fair Price'
        : session?.price === 0
        ? 'Free'
        : `${session?.price || 0} ${session?.currency?.toUpperCase()}`;
    }

    return session?.pay_what_you_want
      ? 'Your Fair Price'
      : session?.total_price === 0 || session?.price === 0
      ? 'Free'
      : `${session?.total_price || session?.price || 0} ${session?.currency?.toUpperCase()}`;
  };

  return (
    <Row justify="space-between" gutter={[8, 16]}>
      <Col xs={12} lg={8}>
        <Text className={styles.text} type="secondary">
          {!!lg && 'Session '}Type
        </Text>
        <Text className={styles.subText}>{session?.group ? 'Group' : '1-on-1'}</Text>
      </Col>
      {!session?.bundle_only && (
        <Col xs={12} lg={8}>
          <Text className={styles.text} type="secondary">
            Price
          </Text>
          <Text className={styles.subText}>{renderSessionPrice()}</Text>
        </Col>
      )}
      {documentUrls.length > 0 && (
        <Col xs={24} lg={session?.bundle_only ? 16 : 8}>
          <Text className={styles.text} type="secondary">
            {!!lg && 'Session '}Pre-read file(s)
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
                  {documentUrl.split('_').splice(1).join('_') || 'Download'}
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
