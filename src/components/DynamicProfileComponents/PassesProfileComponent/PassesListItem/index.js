import React from 'react';

import { Row, Col, Divider, Typography } from 'antd';

import styles from './style.module.scss';

const { Text, Title } = Typography;

const PassesListItem = ({ pass }) => {
  const renderPassPrice = () => {
    // TODO: Might also want to adjust here when PWYW is implemented
    if (pass.price > 0 && pass.currency !== '') {
      return `${pass.currency.toUpperCase()} ${pass.price}`;
    } else {
      return 'Free';
    }
  };

  return (
    <div className={styles.passItem}>
      <Row gutter={[8, 4]}>
        <Col xs={24}>
          <Title level={5} ellipsis={{ rows: 1 }} className={styles.passTitle}>
            {pass.name}
          </Title>
        </Col>
        <Col xs={24}>
          {/* <Space className={styles.passDetails} align="center" split={<Divider type="vertical" className={styles.passDivider} />}>
            <Text className={styles.passValidity}> {`${pass.validity} day${pass.validity > 1 ? 's' : ''}`} </Text>
            <Text className={styles.passPrice}> {renderPassPrice()} </Text>
          </Space> */}
          <Row gutter={8} className={styles.passDetails}>
            <Col xs={11} className={styles.textAlignCenter}>
              <Text className={styles.passValidity}> {`${pass.validity} day${pass.validity > 1 ? 's' : ''}`} </Text>
            </Col>
            <Col xs={2} className={styles.textAlignCenter}>
              <Divider type="vertical" className={styles.passDivider} />
            </Col>
            <Col xs={11} className={styles.textAlignCenter}>
              <Text className={styles.passPrice}> {renderPassPrice()} </Text>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default PassesListItem;
