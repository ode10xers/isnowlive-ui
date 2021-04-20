import React, { useState } from 'react';
import { Form, Input, Button, Row, Col, message } from 'antd';

import { useGlobalContext } from 'services/globalContext';
import {
  mixPanelEventTags,
  mapUserToMixPanel,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';

import Routes from 'routes';
import apis from 'apis';
import http from 'services/http';
import { formLayout, formTailLayout } from 'layouts/FormLayouts';
import validationRules from 'utils/validation';

import styles from './style.module.scss';
import { gtmTriggerEvents, pushToDataLayer } from 'services/integrations/googleTagManager';

const { Item } = Form;
const { user } = mixPanelEventTags;

const SignUp = ({ history }) => {
  const [form] = Form.useForm();
  const { logIn } = useGlobalContext();
  const [isLoading, setIsLoading] = useState(false);

  const onFinish = async (values) => {
    const eventTag = user.click.signUp;

    try {
      setIsLoading(true);
      const { data } = await apis.user.signup({
        email: values.email,
        is_creator: true,
      });
      if (data) {
        pushToDataLayer(gtmTriggerEvents.CREATOR_SIGNUP, {
          creator_email: values.email,
          creator_external_id: data.external_id,
        });
        http.setAuthToken(data.auth_token);
        logIn(data, true);
        setIsLoading(false);
        mapUserToMixPanel(data);
        trackSuccessEvent(eventTag, { email: values.email });
        history.push(Routes.profile);
      }
    } catch (error) {
      setIsLoading(false);
      trackFailedEvent(eventTag, error, { email: values.email });
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  return (
    <Row align="middle" className={styles.mt50}>
      <Col xs={24} md={{ span: 12, offset: 6 }}>
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
