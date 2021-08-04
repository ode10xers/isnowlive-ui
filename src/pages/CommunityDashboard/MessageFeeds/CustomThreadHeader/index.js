import React from 'react';

import { Row, Col, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const CustomThreadHeader = ({ closeThread }) => (
  <Row>
    <Col>
      <Button type="link" onClick={closeThread} icon={<ArrowLeftOutlined />}>
        Back to feeds
      </Button>
    </Col>
  </Row>
);

export default CustomThreadHeader;
