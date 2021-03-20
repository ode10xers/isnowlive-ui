import React, { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, Row, Col, message } from 'antd';
import { useTranslation } from 'react-i18next';

import Routes from 'routes';
import apis from 'apis';

import http from 'services/http';
import { useGlobalContext } from 'services/globalContext';
import {
  mixPanelEventTags,
  identifyUserInMixPanel,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';

import validationRules from 'utils/validation';
import { getRememberUserEmail } from 'utils/storage';
import { isAPISuccess, ZoomAuthType } from 'utils/helper';
import { sendNewPasswordEmail, showSetNewPasswordModal } from 'components/Modals/modals';

import { formLayout, formTailLayout } from 'layouts/FormLayouts';

import styles from './style.module.scss';

const { Item } = Form;
const { Password } = Input;
const { user } = mixPanelEventTags;

const Login = ({ history }) => {
  const { t: translate } = useTranslation();
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
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
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
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
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
          <Item label={translate('EMAIL')} name="email" rules={validationRules.emailValidation}>
            <Input />
          </Item>

          <Item label={translate('PASSWORD')} name="password" rules={validationRules.passwordValidation}>
            <Password />
          </Item>

          <Item {...formTailLayout}>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              {translate('SUBMIT')}
            </Button>
          </Item>
        </Form>

        <Row>
          <Col {...formTailLayout.wrapperCol}>
            <a href onClick={() => trackAndSetLoginView(user.click.newPassword, false)}>
              {translate('SET_NEW_PASSWORD')}
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
            <h1>{translate('SET_NEW_PASSWORD')}</h1>
          </Col>
        </Row>

        <Form form={emailPasswordForm} {...formLayout} name="basic" onFinish={handleSendNewPasswordEmail}>
          <Item label={translate('EMAIL')} name="email" rules={validationRules.emailValidation}>
            <Input />
          </Item>
          <Item {...formTailLayout}>
            <Button type="primary" htmlType="submit" loading={isLoading}>
              {translate('SEND_EMAIL')}
            </Button>
          </Item>
        </Form>

        <Row>
          <Col {...formTailLayout.wrapperCol}>
            <a href onClick={() => trackAndSetLoginView(user.click.loginWithNewPassword, true)}>
              {translate('LOGIN_WITH_PASSWORD')}
            </a>
          </Col>
        </Row>
      </>
    );
  }

  return (
    <Row align="middle" justify="center" className={styles.mt50}>
      <Col xs={24} md={18} lg={12}>
        {view}
      </Col>
    </Row>
  );
};

export default Login;
