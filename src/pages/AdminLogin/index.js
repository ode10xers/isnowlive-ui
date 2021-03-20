import React, { useCallback, useEffect, useState } from 'react';
import { Form, Input, Button, Row, Col, message } from 'antd';

import Routes from 'routes';
import apis from 'apis';
import validationRules from 'utils/validation';

import http from 'services/http';
import { useGlobalContext } from 'services/globalContext';
import { mixPanelEventTags, trackSuccessEvent, trackFailedEvent } from 'services/integrations/mixpanel';
import { formLayout, formTailLayout } from 'layouts/FormLayouts';

import styles from './style.module.scss';
import { useTranslation } from 'react-i18next';

const { Item } = Form;
const { Password } = Input;
const { user } = mixPanelEventTags;

const AdminLogin = ({ history }) => {
  const { t: translate } = useTranslation();
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
    const eventTag = user.click.adminLogIn;

    try {
      setIsLoading(true);

      const { data } = await apis.admin.login(values);

      if (data) {
        trackSuccessEvent(eventTag, {
          user_email: values.user_email,
          admin_email: values.email,
        });
        http.setAuthToken(data.auth_token);
        logIn(data, false);
        setIsLoading(false);
        redirectBasedOnProfileCriteria(data);
      }
    } catch (error) {
      setIsLoading(false);
      trackFailedEvent(eventTag, error, {
        user_email: values.user_email,
        admin_email: values.email,
      });
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
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
