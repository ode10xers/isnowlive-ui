import React from 'react';
import { Row, Col } from 'antd';

const FullWidthLayout = ({ children }) => {
  return (
    <Row>
      <Col xs={24}>{children}</Col>
    </Row>
  );
};

export default FullWidthLayout;
