import React, { useEffect, useRef } from 'react';
import classNames from 'classnames';
import { Row, Col, Button, Form, Input, Typography } from 'antd';

import validationRules from 'utils/validation';
import { scrollToErrorField } from 'utils/helper';
import { sessionRegistrationformLayout, sessionRegistrationTailLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const { Item } = Form;
const { Password } = Input;

const SessionRegistration = ({ onFinish, showPasswordField, user }) => {
  const [form] = Form.useForm();
  const passwordInput = useRef(null);

  useEffect(() => {
    if (user) {
      form.setFieldsValue(user);
    }
  }, [user, form]);

  useEffect(() => {
    if (showPasswordField && passwordInput.current) {
      passwordInput.current.focus();
    }
  }, [showPasswordField]);

  const onFinishFailed = ({ errorFields }) => {
    scrollToErrorField(errorFields);
  };

  return (
    <div className={classNames(styles.box, styles.p50)}>
      <Row>
        <Col xs={24} md={24}>
          <Title level={3}>Registration</Title>
        </Col>
        <Col xs={24} md={24}>
          <Text>After you register, we will send you an email with the event login information.</Text>
        </Col>
        <Col xs={24} md={24} className={styles.mt10}>
          <Form
            form={form}
            labelAlign="left"
            {...sessionRegistrationformLayout}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
          >
            <Item label="Name" className={styles.nameInputWrapper}>
              <Item className={styles.nameInput} name="first_name" rules={validationRules.nameValidation}>
                <Input placeholder="First Name" />
              </Item>
              <Item className={styles.nameInput} name="last_name" rules={validationRules.nameValidation}>
                <Input placeholder="Last Name" />
              </Item>
            </Item>

            <Item className={styles.emailInput} label="Email" name="email" rules={validationRules.emailValidation}>
              <Input placeholder="Enter your email" />
            </Item>

            {showPasswordField && (
              <Item label="Password" name="password" rules={validationRules.passwordValidation} ref={passwordInput}>
                <Password />
              </Item>
            )}

            <Item {...sessionRegistrationTailLayout}>
              <Button type="primary" htmlType="submit">
                Register
              </Button>
            </Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
};

export default SessionRegistration;
