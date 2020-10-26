import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Checkbox, Row, Col, message } from 'antd';

import { useGlobalContext } from 'services/globalContext';
import Routes from 'routes';
import apis from 'apis';
import http from 'services/http';
import { formLayout, formTailLayout } from 'layouts/FormLayouts';
import validationRules from 'utils/validation';
import { getRememberUserEmail } from 'utils/storage';

import styles from './style.module.scss';

const { Item } = Form;
const { Password } = Input;

const SignUp = ({ history }) => {
  const [form] = Form.useForm();
  const { state, logIn } = useGlobalContext();
  const [isLoading, setIsLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setIsLoading(true);
      const { data } = await apis.user.signup(values);
      if (data) {
        http.service.setAuthToken(data.token);
        logIn(data, values.remember);
        setIsLoading(false);
        history.push(Routes.profile);
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  useEffect(() => {
    form.setFieldsValue({
      email: getRememberUserEmail(),
    });
    if (state.userDetails) {
      history.push(Routes.profile);
    }
  }, [history, state.userDetails, form]);

  return (
    <Row align="middle" className={styles.mt50}>
      <Col span={12} offset={6}>
        <Form form={form} {...formLayout} name="basic" initialValues={{ remember: true }} onFinish={onFinish}>
          <Item label="Email" name="email" rules={validationRules.emailValidation}>
            <Input />
          </Item>
          <Item label="Password" name="password" rules={validationRules.requiredValidation}>
            <Password />
          </Item>

          <Item {...formTailLayout} name="remember" valuePropName="checked">
            <Checkbox>Remember me</Checkbox>
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
