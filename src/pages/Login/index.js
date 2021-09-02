import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, Row, Col, message } from 'antd';

import Routes from 'routes';
import apis from 'apis';

import { sendNewPasswordEmail, showSetNewPasswordModal } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { getRememberUserEmail } from 'utils/storage';
import { isAPISuccess, generateUrlFromUsername } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';
import {
  mixPanelEventTags,
  identifyUserInMixPanel,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';

import { formLayout, formTailLayout } from 'layouts/FormLayouts';

import styles from './style.module.scss';

const { Item } = Form;
const { Password } = Input;
const { user } = mixPanelEventTags;

const Login = ({ history }) => {
  const [loginForm] = Form.useForm();
  const [emailPasswordForm] = Form.useForm();
  const { state, logIn } = useGlobalContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);

  const redirectBasedOnProfileCriteria = useCallback(
    (user) => {
      if (user) {
        if (user.is_creator) {
          if (!user.first_name || !user.last_name || !user.username) {
            history.push(Routes.onboardingName);
          } else if (user.profile_complete === false) {
            // history.push(Routes.onboardingProfile);
            window.open(`${generateUrlFromUsername(user.username)}${Routes.onboardingProfile}`, '_self');
          } else {
            history.push(Routes.creatorDashboard.rootPath);
          }
        } else {
          history.push(Routes.attendeeDashboard.rootPath);
        }
      }
    },
    [history]
  );

  const onFinish = async (values) => {
    const eventTag = user.click.logIn;

    try {
      setIsLoading(true);
      const { data } = await apis.user.login(values);
      if (data) {
        logIn(data, values.remember);
        identifyUserInMixPanel(data);
        trackSuccessEvent(eventTag, { email: values.email });
        setIsLoading(false);
        redirectBasedOnProfileCriteria(data);
      }
    } catch (error) {
      setIsLoading(false);
      trackFailedEvent(eventTag, error, { email: values.email });
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  const handleSendNewPasswordEmail = async (values) => {
    const eventTag = user.click.sendNewPasswordEmail;

    try {
      setIsLoading(true);
      const { status } = await sendNewPasswordEmail(values.email);
      if (isAPISuccess(status)) {
        trackSuccessEvent(eventTag, { email: values.email });

        setIsLoading(false);
        showSetNewPasswordModal(values.email);
      }
    } catch (error) {
      setIsLoading(false);
      trackFailedEvent(eventTag, error, { email: values.email });
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  useEffect(() => {
    loginForm.setFieldsValue({
      email: getRememberUserEmail(),
    });
    if (state.userDetails) {
      redirectBasedOnProfileCriteria(state.userDetails);
    }
  }, [loginForm, redirectBasedOnProfileCriteria, state.userDetails]);

  const trackAndSetLoginView = (eventTag, loginViewValue) => {
    trackSimpleEvent(eventTag);
    setIsLoginView(loginViewValue);
  };

  let view = null;

  if (isLoginView) {
    view = (
      <div className={styles.loginFormContainer}>
        <div className={styles.loginHeadingText}>Enter your email and password</div>
        <div className={styles.loginHeadingSubtext}>
          If you've created an account but haven't set a password, click on the <b>Set new password</b> below
        </div>
        <div className={styles.loginForm}>
          <Form form={loginForm} wrapperCol={24} onFinish={onFinish}>
            <Item name="email" rules={validationRules.emailValidation}>
              <Input placeholder="Your registered email" />
            </Item>

            <Item name="password" rules={validationRules.passwordValidation}>
              <Password placeholder="Your password" />
            </Item>

            <Row justify="center">
              <Col>
                <Button className={styles.submitButton} type="primary" htmlType="submit" loading={isLoading}>
                  Login
                </Button>
              </Col>
            </Row>
          </Form>

          <Row justify="center">
            <Col>
              <Button
                className={styles.linkButton}
                type="link"
                onClick={() => trackAndSetLoginView(user.click.newPassword, false)}
              >
                Set new password
              </Button>
            </Col>
          </Row>
        </div>
      </div>
    );
  } else {
    view = (
      <div className={styles.loginFormContainer}>
        <div className={styles.loginHeadingText}>Set a new password</div>
        <div className={styles.loginHeadingSubtext}>Enter the email you created the account with</div>
        <div className={styles.loginForm}>
          <Form form={emailPasswordForm} wrapperCol={24} onFinish={handleSendNewPasswordEmail}>
            <Item name="email" rules={validationRules.emailValidation}>
              <Input placeholder="The email associated with your account" />
            </Item>
            <Row justify="center">
              <Col>
                <Button className={styles.submitButton} type="primary" htmlType="submit" loading={isLoading}>
                  Send Email
                </Button>
              </Col>
            </Row>
          </Form>
          <Row justify="center">
            <Col>
              <Button
                className={styles.linkButton}
                type="link"
                onClick={() => trackAndSetLoginView(user.click.loginWithNewPassword, true)}
              >
                Have an account? Sign in.
              </Button>
            </Col>
          </Row>
        </div>
      </div>
    );
  }

  return (
    <Row align="middle" justify="center">
      <Col xs={24} md={18}>
        {view}
      </Col>
    </Row>
  );
};

export default Login;
