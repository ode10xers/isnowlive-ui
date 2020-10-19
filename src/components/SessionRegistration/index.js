import React from 'react';
import classNames from 'classnames';
import { Row, Col, Button, Form, Input, Typography } from 'antd';

import validationRules from '../../utils/validation';
import { sessionRegistrationformLayout, sessionRegistrationTailLayout } from '../../layouts/FormLayouts';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const SessionRegistration = ({ onFinish }) => {
  return (
    <div className={classNames(styles.box, styles.p50)}>
      <Row>
        <Col xs={24} md={24}>
          <Title level={3}>Registration</Title>
        </Col>
        <Col xs={24} md={24}>
          <Text>After you register, we will send you an email with the event login information.</Text>
        </Col>
        <Col xs={24} md={18} className={styles.mt10}>
          <Form labelAlign="left" {...sessionRegistrationformLayout} onFinish={onFinish}>
            <Form.Item label="Name" className={styles.nameInputWrapper}>
              <Form.Item className={styles.nameInput} name="first_name" rules={validationRules.nameValidation}>
                <Input placeholder="First Name" />
              </Form.Item>
              <Form.Item className={styles.nameInput} name="last_name" rules={validationRules.nameValidation}>
                <Input placeholder="Last Name" />
              </Form.Item>
            </Form.Item>

            <Form.Item label="Email" name="email" rules={validationRules.emailValidation}>
              <Input placeholder="Enter your email" />
            </Form.Item>

            <Form.Item {...sessionRegistrationTailLayout}>
              <Button type="primary" htmlType="submit">
                Register
              </Button>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
};

export default SessionRegistration;
