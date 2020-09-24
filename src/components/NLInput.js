import React from 'react';
import classNames from 'classnames';
import { Row, Col } from 'antd';
import styles from './NLInputStyles.module.scss';

export const NLInput = ({ label, input, errorMessage = null }) => {
  return (
    <Row className={classNames(styles.mt10, styles.mb10)}>
      <Col xs={24} lg={{ span: 6, push: 3 }}>
        {label}
      </Col>
      <Col xs={24} lg={14}>
        {input}
      </Col>
      <Col xs={24} lg={4}></Col>
      <Col xs={24} lg={{ span: 6, push: 3 }}></Col>
      <Col xs={24} lg={14}>
        {errorMessage}
      </Col>
      <Col xs={24} lg={4}></Col>
    </Row>
  );
};
