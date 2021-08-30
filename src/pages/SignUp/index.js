import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';

import Routes from 'routes';
import apis from 'apis';

import { useGlobalContext } from 'services/globalContext';
import {
  mixPanelEventTags,
  mapUserToMixPanel,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';
import { gtmTriggerEvents, pushToDataLayer } from 'services/integrations/googleTagManager';

import validationRules from 'utils/validation';

import styles from './style.module.scss';

const { Item } = Form;
const { user } = mixPanelEventTags;

const SignUp = ({ history }) => {
  const [form] = Form.useForm();
  const { logIn } = useGlobalContext();
  const [isLoading, setIsLoading] = useState(false);

  const onFinish = async (values) => {
    const eventTag = user.click.signUp;
    const referenceCode = JSON.parse(localStorage.getItem('ref'));
    try {
      setIsLoading(true);
      const { data } = await apis.user.signup({
        email: values.email,
        is_creator: true,
        referrer: referenceCode,
      });
      if (data) {
        pushToDataLayer(gtmTriggerEvents.CREATOR_SIGNUP, {
          creator_email: values.email,
          creator_external_id: data.external_id,
        });
        logIn(data, true);
        setIsLoading(false);
        mapUserToMixPanel(data);
        localStorage.removeItem('ref');
        trackSuccessEvent(eventTag, { email: values.email });
        history.push(Routes.onboardingName);
      }
    } catch (error) {
      setIsLoading(false);
      trackFailedEvent(eventTag, error, { email: values.email });
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  return (
    <div className={styles.signupContainer}>
      <div className={styles.signupHeadingText}>Let’s get started</div>
      <div className={styles.signupHeadingSubtext}>Enter your email to get started</div>
      <div className={styles.signupForm}>
        <Form form={form} name="signupForm" onFinish={onFinish}>
          <Item name="email" rules={validationRules.emailValidation}>
            <Input placeholder="Enter Your Email" />
          </Item>
          <Button className={styles.signupButton} type="primary" htmlType="submit" loading={isLoading}>
            Continue
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default SignUp;
