import React from 'react';
import classNames from 'classnames';
import { Form, Row, Col, Input, Typography, Button } from 'antd';

import apis from 'apis';

import http from 'services/http';
import { useGlobalContext } from 'services/globalContext';

import { scrollToErrorField } from 'utils/helper';
import validationRules from 'utils/validation';

import styles from './style.module.scss';
import { showErrorModal } from 'components/Modals/modals';

import { signInFormLayout, signInTailLayout } from 'layouts/FormLayouts';

const { Title, Text } = Typography;

const SignInForm = ({ user, hideSignInForm }) => {
  const [form] = Form.useForm();
  const { logIn } = useGlobalContext();

  const onFinish = async (values) => {
    if (user) {
      showErrorModal('You are already signed in!');
      return;
    }

    try {
      const { data } = await apis.user.login({
        email: values.email,
        password: values.password,
      });

      if (data) {
        http.setAuthToken(data.auth_token);
        logIn(data, true);
        hideSignInForm();
      }
    } catch (error) {
      showErrorModal('Something went wrong', error.response?.data?.message);
    }
  };

  const onFinishFailed = ({ errorFields }) => {
    scrollToErrorField(errorFields);
  };

  return (
    <div className={classNames(styles.box, styles.p50, styles.mb20)}>
      <Row>
        <Col xs={24} md={24}>
          <Title level={3}> Sign In </Title>
        </Col>
        <Col xs={24} md={24}>
          <Text>If you have an existing account with an active pass, you need to sign in first to use it</Text>
        </Col>
        <Col xs={24} md={24} className={styles.mt10}>
          <Form form={form} labelAlign="left" onFinish={onFinish} onFinishFailed={onFinishFailed} {...signInFormLayout}>
            <Form.Item label="Email" name="email" rules={validationRules.emailValidation}>
              <Input className={styles.signInInput} placeholder="Enter your email" />
            </Form.Item>
            <Form.Item label="Password" name="password" rules={validationRules.passwordValidation}>
              <Input.Password className={styles.signInInput} placeholder="Enter your password" />
            </Form.Item>
            <Form.Item {...signInTailLayout}>
              <Row>
                <Col>
                  <Button type="primary" htmlType="submit">
                    Sign In
                  </Button>
                </Col>
                <Col>
                  <Button type="link" onClick={() => hideSignInForm()}>
                    Don't have an account? Register Now
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
};

export default SignInForm;
