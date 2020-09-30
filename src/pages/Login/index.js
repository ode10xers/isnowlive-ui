import React, { useEffect } from 'react';
import { Form, Input, Button, Checkbox, Row, Col } from 'antd';
import styles from './style.module.scss';
import { useGlobalContext } from '../../services/globalContext';
import Routes from '../../routes';
import apis from '../../apis';
import http from '../../services/http';
import validationRules from '../../utils/validation';

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};
const tailLayout = {
  wrapperCol: { offset: 8, span: 16 },
};

const Login = ({ history }) => {
  const { state, logIn } = useGlobalContext();

  const onFinish = async (values) => {
    try {
      console.log('Success:', values);
      const { data } = await apis.user.login(values);
      if (data) {
        http.setAuthToken(data.token);
        logIn(data, true);
        history.push(Routes.profile);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  useEffect(() => {
    if (state.userDeatils) {
      history.push(Routes.profile);
    }
  }, [history, state.userDeatils]);

  return (
    <Row align="middle" className={styles.mt50}>
      <Col span={12} offset={6}>
        <Form
          {...layout}
          name="basic"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
        >
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
