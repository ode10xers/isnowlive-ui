import React, { useState } from 'react';
import classNames from 'classnames';
import { Form, Row, Col, Input, Typography, Button, message } from 'antd';

import apis from 'apis';

import http from 'services/http';
import { useGlobalContext } from 'services/globalContext';

import { scrollToErrorField } from 'utils/helper';
import validationRules from 'utils/validation';

import styles from './style.module.scss';
import TermsAndConditionsText from 'components/TermsAndConditionsText';
import { showErrorModal } from 'components/Modals/modals';

import { signInFormLayout, signInTailLayout } from 'layouts/FormLayouts';

const { Title, Text } = Typography;

const SignInForm = ({ user, hideSignInForm, onSetNewPassword }) => {
  const [form] = Form.useForm();
  const { logIn } = useGlobalContext();
  const [incorrectPassword, setIncorrectPassword] = useState(false);
  const [showLegalsErrorMessage, setShowLegalsErrorMessage] = useState(false);
  const [legalsAccepted, setLegalsAccepted] = useState(true);

  const handleSetNewPassword = async () => {
    try {
      const values = await form.validateFields(['email']);
      onSetNewPassword(values.email);
    } catch (error) {
      showErrorModal('Please input your email first!');
    }
  };

  const onFinish = async (values) => {
    setIncorrectPassword(false);
    setShowLegalsErrorMessage(false);

    if (!legalsAccepted) {
      setShowLegalsErrorMessage(true);
      return;
    }

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
      if (error.response?.status === 403) {
        setIncorrectPassword(true);
        message.error('Incorrect email or password');
      } else {
        showErrorModal('Something went wrong', error.response?.data?.message);
      }
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
          <Text>
            If you have ever bought a session with us, then you have an account. Please sign in or use the set new
            password option to set a password if you haven’t already
          </Text>
        </Col>
        <Col xs={24} md={24} className={styles.mt10}>
          <Form form={form} labelAlign="left" onFinish={onFinish} onFinishFailed={onFinishFailed} {...signInFormLayout}>
            <Form.Item label="Email" name="email" rules={validationRules.emailValidation}>
              <Input className={styles.signInInput} placeholder="Enter your email" />
            </Form.Item>
            <Form.Item label="Password" name="password" rules={validationRules.passwordValidation}>
              <Input.Password className={styles.signInInput} placeholder="Enter your password" />
            </Form.Item>
            {incorrectPassword && (
              <Form.Item {...signInTailLayout}>
                <Text type="danger">Email or password you entered was incorrect, please try again</Text>
              </Form.Item>
            )}
            {showLegalsErrorMessage && (
              <Form.Item {...signInTailLayout}>
                <Text type="danger" className={styles.smallText}>
                  To proceed, you need to check the checkbox below
                </Text>
              </Form.Item>
            )}
            <Form.Item {...signInTailLayout}>
              <TermsAndConditionsText
                shouldCheck={true}
                isChecked={legalsAccepted}
                setChecked={(checked) => setLegalsAccepted(checked)}
              />
            </Form.Item>
            <Form.Item {...signInTailLayout}>
              <Button className={styles.linkBtn} type="link" onClick={() => handleSetNewPassword()}>
                Set a new password
              </Button>
            </Form.Item>
            <Form.Item {...signInTailLayout}>
              <Row>
                <Col xs={24} xl={6}>
                  <Button size="large" type="primary" htmlType="submit">
                    Sign In
                  </Button>
                </Col>
                <Col xs={24} xl={18}>
                  <Button className={styles.linkBtn} type="link" onClick={() => hideSignInForm()}>
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
