import React from 'react';

import { Row, Col, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

import styles from './styles.module.scss';

const CustomThreadHeader = ({ closeThread }) => (
  <Row className={styles.threadHeader}>
    <Col xs={24}>
      <Button type="link" onClick={closeThread} icon={<ArrowLeftOutlined />}>
        Back to feeds
      </Button>
    </Col>
  </Row>
);

export default CustomThreadHeader;
