import React from 'react';
import classNames from 'classnames';
import { Row, Col } from 'antd';
import styles from './styles.module.scss';

const Section = ({ children }) => (
  <Row className={classNames(styles.bgLight, styles.mb50, styles.pt50, styles.pb50)}>
    <Col xs={2} md={2}></Col>
    <Col xs={20} md={20}>
      {children}
    </Col>
    <Col xs={2} md={2}></Col>
  </Row>
);
export default Section;
