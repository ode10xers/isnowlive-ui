import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, Row, Col, message, Modal, Typography } from 'antd';

import Routes from 'routes';
import apis from 'apis';
import { useGlobalContext } from 'services/globalContext';
import {
  mixPanelEventTags,
  identifyUserInMixPanel,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';
import { openFreshChatWidget } from 'services/integrations/fresh-chat';

import http from 'services/http';
import validationRules from 'utils/validation';
import { getRememberUserEmail } from 'utils/storage';
import { isAPISuccess, ZoomAuthType } from 'utils/helper';
import { formLayout, formTailLayout } from 'layouts/FormLayouts';

import styles from './style.module.scss';

const { Item } = Form;
const { Password } = Input;
const { user } = mixPanelEventTags;
const { Paragraph, Text } = Typography;

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
          if (user.profile_complete === false) {
            history.push(Routes.profile);
          } else if (user.zoom_connected === ZoomAuthType.NOT_CONNECTED) {
            history.push(Routes.livestream);
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
        http.setAuthToken(data.auth_token);
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

  const sendNewPasswordEmail = async (values) => await apis.user.sendNewPasswordEmail(values);

  const handleSendNewPasswordEmail = async (values) => {
    const eventTag = user.click.sendNewPasswordEmail;

    try {
      setIsLoading(true);
      const { status } = await sendNewPasswordEmail(values);
      if (isAPISuccess(status)) {
        trackSuccessEvent(eventTag, { email: values.email });

        setIsLoading(false);
        Modal.confirm({
          mask: true,
          center: true,
          closable: true,
          maskClosable: true,
          title: 'Set a new password',
          content: (
            <>
              <Paragraph>
                We have sent you a link to setup your new password on your email <Text strong>{values.email}</Text>.
              </Paragraph>
              <Paragraph>
                <Button className={styles.linkButton} type="link" onClick={() => sendNewPasswordEmail(values)}>
                  Didn't get it? Send again.
                </Button>
              </Paragraph>
            </>
          ),
          okText: 'Okay',
          cancelText: 'Talk to us',
          onCancel: () => openFreshChatWidget(),
        });
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
          <Col xs={24} md={{ span: 18, offset: 6 }}>
            <a href onClick={() => trackAndSetLoginView(user.click.newPassword, false)}>
              Set a new password
            </a>
          </Col>
        </Row>
      </>
    );
  } else {
    view = (
      <>
        <Row>
          <Col xs={24} md={{ span: 18, offset: 6 }}>
            <h1>Set a new password</h1>
          </Col>
        </Row>

        <Form form={emailPasswordForm} {...formLayout} name="basic" onFinish={handleSendNewPasswordEmail}>
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
          <Col xs={24} md={{ span: 18, offset: 6 }}>
            <a href onClick={() => trackAndSetLoginView(user.click.loginWithNewPassword, true)}>
              Login with password
            </a>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <Row align="middle" className={styles.mt50}>
      <Col xs={24} md={{ span: 12, offset: 6 }}>
        {view}
      </Col>
    </Row>
  );
};

export default Login;
