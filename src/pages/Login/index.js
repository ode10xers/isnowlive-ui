import React, { useEffect } from 'react';
import { Form, Input, Button, Checkbox, Row, Col, message } from 'antd';
import { useGlobalContext } from '../../services/globalContext';
import Routes from '../../routes';
import apis from '../../apis';
import http from '../../services/http';
import validationRules from '../../utils/validation';
import { layout, tailLayout } from '../../utils/constants';
import styles from './style.module.scss';

const Login = ({ history }) => {
  const { state, logIn } = useGlobalContext();

  const onFinish = async (values) => {
    try {
      const { data } = await apis.user.login(values);
      if (data) {
        http.setAuthToken(data.token);
        logIn(data, values.remember);
        history.push(Routes.profile);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  useEffect(() => {
    if (state.userDeatils) {
      history.push(Routes.profile);
    }
  }, [history, state.userDeatils]);

  return (
    <Row align="middle" className={styles.mt50}>
      <Col span={12} offset={6}>
        <Form {...layout} name="basic" initialValues={{ remember: true }} onFinish={onFinish}>
          <Form.Item label="Email" name="email" rules={validationRules.emailValidation}>
            <Input />
          </Form.Item>

          <Form.Item label="Password" name="password" rules={validationRules.passwordValidation}>
            <Input.Password />
          </Form.Item>

          <Form.Item {...tailLayout} name="remember" valuePropName="checked">
            <Checkbox>Remember me</Checkbox>
          </Form.Item>

          <Form.Item {...tailLayout}>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Col>
    </Row>
  );
};

export default Login;
