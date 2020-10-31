import React, { useState } from 'react';
import { Form, Input, Button, Row, Col, message } from 'antd';

import { useGlobalContext } from 'services/globalContext';
import Routes from 'routes';
import apis from 'apis';
import http from 'services/http';
import { formLayout, formTailLayout } from 'layouts/FormLayouts';
import validationRules from 'utils/validation';

import styles from './style.module.scss';

const { Item } = Form;

const SignUp = ({ history }) => {
  const [form] = Form.useForm();
  const { logIn } = useGlobalContext();
  const [isLoading, setIsLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setIsLoading(true);
      const { data } = await apis.user.signup({
        email: values.email,
        is_creator: true,
      });
      if (data) {
        http.service.setAuthToken(data.auth_token);
        logIn(data, true);
        setIsLoading(false);
        history.push(Routes.profile);
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  return (
    <Row align="middle" className={styles.mt50}>
      <Col span={12} offset={6}>
        <Form form={form} {...formLayout} name="basic" initialValues={{ remember: true }} onFinish={onFinish}>
          <Item label="Email" name="email" rules={validationRules.emailValidation}>
            <Input />
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

export default SignUp;
