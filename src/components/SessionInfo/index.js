import React from 'react';
import { Row, Col, Button, Typography } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import { isValidFile } from 'utils/helper';
import { isMobileDevice } from 'utils/device';

import styles from './style.module.scss';

const { Text } = Typography;

const SessionInfo = ({ session }) => {
  const { t } = useTranslation();

  return (
    <Row justify="space-between" gutter={[8, 16]}>
      <Col xs={12} lg={8}>
        <Text className={styles.text} type="secondary">
          {!isMobileDevice && t('SESSION')} {t('TYPE')}
        </Text>
        <Text className={styles.subText}>{session?.group ? t('GROUP') : t('1_TO_1')}</Text>
      </Col>
      {!session?.is_course && (
        <Col xs={12} lg={8}>
          <Text className={styles.text} type="secondary">
            {t('PRICE')}
          </Text>
          <Text className={styles.subText}>
            {session?.price || 0} {session?.currency.toUpperCase()}
          </Text>
        </Col>
      )}
      {session?.document_url && isValidFile(session?.document_url) && (
        <Col xs={24} lg={session?.is_course ? 16 : 8}>
          <Text className={styles.text} type="secondary">
            {!isMobileDevice && t('SESSION')} {t('PRE_READ_FILE')}
          </Text>
          <Button
            className={styles.downloadButton}
            type="link"
            icon={<FilePdfOutlined />}
            size="middle"
            onClick={() => window.open(session?.document_url)}
          >
            {session?.document_url.split('_').slice(-1)[0] || t('DOWNLOAD')}
          </Button>
        </Col>
      )}
    </Row>
  );
};

export default SessionInfo;
