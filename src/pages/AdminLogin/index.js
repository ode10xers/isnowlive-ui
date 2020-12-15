import React, { useCallback, useEffect, useState } from 'react';
import { Form, Input, Button, Row, Col, message } from 'antd';

import Routes from 'routes';
import apis from 'apis';
import validationRules from 'utils/validation';

import http from 'services/http';
import { useGlobalContext } from 'services/globalContext';
import { formLayout, formTailLayout } from 'layouts/FormLayouts';

import styles from './style.module.scss';

const { Item } = Form;
const { Password } = Input;

const AdminLogin = ({ history }) => {
  const [loginForm] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);

  const { logIn, logOut } = useGlobalContext();

  const redirectBasedOnProfileCriteria = useCallback(
    (user) => {
      if (user.is_creator) {
        if (user.profile_complete === false) {
          history.push(Routes.profile);
        } else if (user.zoom_connected === false) {
          history.push(Routes.livestream);
        } else {
          history.push(Routes.creatorDashboard.rootPath);
        }
      } else {
        history.push(Routes.attendeeDashboard.rootPath);
      }
    },
    [history]
  );

  const onFinish = async (values) => {
    try {
      setIsLoading(true);
      console.log(values);

      const { data } = await apis.admin.login(values);

      if (data) {
        http.setAuthToken(data.auth_token);
        logIn(data, false);
        setIsLoading(false);
        redirectBasedOnProfileCriteria(data);
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  // Logs out when accessing admin page
  useEffect(() => {
    logOut(history, true);
    //eslint-disable-next-line
  }, []);

  return (
    <Row align="middle" className={styles.mt50}>
      <Col xs={24} md={{ span: 12, offset: 6 }}>
        <Form form={loginForm} {...formLayout} name="basic" onFinish={onFinish}>
          <Item label="User Email" name="user_email" rules={validationRules.emailValidation}>
            <Input />
          </Item>

          <Item label="Admin Email" name="email" rules={validationRules.emailValidation}>
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
      </Col>
    </Row>
  );
};

export default AdminLogin;
