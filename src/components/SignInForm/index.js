import React, { useState } from 'react';
import { Form, Row, Col, Input, Typography, Button, message } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import TermsAndConditionsText from 'components/TermsAndConditionsText';
import { showErrorModal, showSetNewPasswordModal, sendNewPasswordEmail } from 'components/Modals/modals';

import { isUnapprovedUserError, isAPISuccess } from 'utils/helper';
import validationRules from 'utils/validation';

import { useGlobalContext } from 'services/globalContext';

import { signInFormLayout, signInTailLayout } from 'layouts/FormLayouts';

import styles from './style.module.scss';

const { Title, Text } = Typography;

const SignInForm = ({ user, hideSignInForm }) => {
  const [form] = Form.useForm();
  const { logIn } = useGlobalContext();
  const [isLoading, setIsLoading] = useState(false);
  const [incorrectPassword, setIncorrectPassword] = useState(false);
  const [showLegalsErrorMessage, setShowLegalsErrorMessage] = useState(false);
  const [legalsAccepted, setLegalsAccepted] = useState(true);

  const handleSetNewPassword = async () => {
    try {
      const values = await form.validateFields(['email']);
      const email = values.email;

      try {
        setIsLoading(true);
        const { status } = await sendNewPasswordEmail(email);
        if (isAPISuccess(status)) {
          setIsLoading(false);
          showSetNewPasswordModal(email);
        }
      } catch (error) {
        setIsLoading(false);
        message.error(error.response?.data?.message || 'Something went wrong.');
      }
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
      const { status, data } = await apis.user.login({
        email: values.email,
        password: values.password,
      });

      if (isAPISuccess(status) && data) {
        logIn(data, true);
        hideSignInForm();
      }
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.message === 'invalid password passed') {
        setIncorrectPassword(true);
        message.error('Incorrect email or password');
      } else if (!isUnapprovedUserError(error.response)) {
        showErrorModal('Something went wrong', error.response?.data?.message);
      }
    }
  };

  return (
    <div className={styles.signInWrapper}>
      <Loader loading={isLoading} text="Signing in..." size="large">
        <Row>
          <Col xs={24} md={24}>
            <Title level={3} className={styles.signInTitle}>
              {' '}
              Sign In{' '}
            </Title>
          </Col>
          <Col xs={24} md={24}>
            <Text className={styles.signInHelpText}>
              If you have ever bought a session with us, then you have an account. Please sign in or use the set new
              password option to set a password if you haven’t already
            </Text>
          </Col>
          <Col xs={24} md={24} className={styles.formContainer}>
            <Form form={form} labelAlign="left" onFinish={onFinish} scrollToFirstError={true} {...signInFormLayout}>
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
                  <Col xs={24}>
                    <Button className={styles.signInButton} size="large" type="primary" htmlType="submit">
                      Sign In
                    </Button>
                  </Col>
                  <Col xs={24}>
                    <Button className={styles.linkBtn} type="link" onClick={() => hideSignInForm()}>
                      Don't have an account? Register Now
                    </Button>
                  </Col>
                </Row>
              </Form.Item>
            </Form>
          </Col>
        </Row>
      </Loader>
    </div>
  );
};

export default SignInForm;
