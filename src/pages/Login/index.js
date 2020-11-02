import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Row, Col, message } from 'antd';

import Routes from 'routes';
import apis from 'apis';
import { useGlobalContext } from 'services/globalContext';
import http from 'services/http';
import validationRules from 'utils/validation';
import { getRememberUserEmail } from 'utils/storage';
import { isAPISuccess } from 'utils/helper';
import { formLayout, formTailLayout } from 'layouts/FormLayouts';

import styles from './style.module.scss';

const { Item } = Form;
const { Password } = Input;

const Login = ({ history }) => {
  const [loginForm] = Form.useForm();
  const [emailPasswordForm] = Form.useForm();
  const { state, logIn } = useGlobalContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);

  const onFinish = async (values) => {
    try {
      setIsLoading(true);
      const { data } = await apis.user.login(values);
      if (data) {
        http.service.setAuthToken(data.auth_token);
        logIn(data, values.remember);
        setIsLoading(false);
        history.push(Routes.profile);
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  const sendNewPasswordEmail = async (values) => {
    try {
      setIsLoading(true);
      const { status } = await apis.user.sendNewPasswordEmail(values);
      if (isAPISuccess(status)) {
        setIsLoading(false);
        message.success('Email sent successfully.');
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  }

  useEffect(() => {
    loginForm.setFieldsValue({
      email: getRememberUserEmail(),
    });
    if (state.userDetails) {
      history.push(Routes.profile);
    }
  }, [history, state.userDetails, loginForm]);

  let view = null;

  if (isLoginView) {
    view = (
      <>
        <Form form={loginForm} {...formLayout} name="basic" onFinish={onFinish}>
          <Item label="Email" name="email" rules={validationRules.emailValidation}>
            <Input />
          </Item>

          <Item label="Password" name="password" rules={validationRules.passwordValidation}>
            <Password />
          </Item>

          <Item {...formTailLayout}>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Submit
            </Button>
          </Item>
        </Form>

        <Row>
          <Col span={16} offset={8}>
            <a href onClick={() => setIsLoginView(false)}>Set a new password</a>
          </Col>
        </Row>
      </>
    )
  } else {
    view = (
      <>
        <Row>
          <Col span={16} offset={8}>
            <h1>Set a new password</h1>
          </Col>
        </Row>

        <Form form={emailPasswordForm} {...formLayout} name="basic" onFinish={sendNewPasswordEmail}>
          <Item label="Email" name="email" rules={validationRules.emailValidation}>
            <Input />
          </Item>
          <Item {...formTailLayout}>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              Send Email
            </Button>
          </Item>
        </Form>

        <Row>
          <Col span={16} offset={8}>
            <a href onClick={() => setIsLoginView(true)}>Login with password</a>
          </Col>
        </Row>
      </>
    )
  }

  return (
    <Row align="middle" className={styles.mt50}>
      <Col span={12} offset={6}>
        {view}
      </Col>
    </Row>
  );
};

export default Login;
