import React from 'react';
import { Row, Col } from 'antd';

//TODO give basic layout for website here, add more layout for different type of pages
const DefaultLayout = ({ children }) => {
  return (
    <Row>
      <Col xs={2} md={4}></Col>
      <Col xs={20} md={16}>
        {children}
      </Col>
      <Col xs={2} md={4}></Col>
    </Row>
  );
};

export default DefaultLayout;
