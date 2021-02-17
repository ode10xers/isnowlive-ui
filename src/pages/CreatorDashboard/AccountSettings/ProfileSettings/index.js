import React, { useState, useEffect } from 'react';

import { Row, Col, Button, Typography } from 'antd';

// import apis from 'apis';

import styles from './styles.module.scss';

const { Title } = Typography;

const ProfileSettings = () => {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setSubmitting(false);
    //eslint-disable-next-line
  }, []);

  return (
    <div>
      <Row gutter={[8, 24]} className={styles.profileSettingsWrapper}>
        <Col span={24} className={styles.textAlignLeft}>
          <Title level={3}> Profile Settings </Title>
        </Col>
        <Col span={24}>
          <div className={styles.sectionWrapper}></div>
        </Col>
        <Col span={24}>
          <Button type="primary" loading={submitting} className={styles.saveBtn}>
            Save Changes
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default ProfileSettings;
