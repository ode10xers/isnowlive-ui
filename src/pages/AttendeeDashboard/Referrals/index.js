import React from 'react';
import { Row, Col, Typography } from 'antd';
import styles from './styles.module.scss';
const { Title } = Typography;

const Referrals = () => {
  return (
    <div className={styles.box}>
      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Title level={4}> My Referrals </Title>
        </Col>
      </Row>
    </div>
  );
};

export default Referrals;
