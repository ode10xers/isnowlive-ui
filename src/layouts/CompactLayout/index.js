import React from 'react';
import { Row, Col } from 'antd';

//TODO give basic layout for website here, add more layout for different type of pages
const CompactLayout = ({ children }) => {
  return (
    <Row>
      <Col xs={2}></Col>
      <Col xs={20}>{children}</Col>
      <Col xs={2}></Col>
    </Row>
  );
};

export default CompactLayout;
