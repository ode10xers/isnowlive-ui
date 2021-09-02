import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Form, Input, Button, Row, Col, message } from 'antd';

import Routes from 'routes';
import apis from 'apis';
import validationRules from 'utils/validation';
import { isAPISuccess } from 'utils/helper';
import { mixPanelEventTags, trackSuccessEvent, trackFailedEvent } from 'services/integrations/mixpanel';

import styles from './style.module.scss';

const { Item } = Form;
const { Password } = Input;
const { user } = mixPanelEventTags;

const ResetPassword = () => {
  const history = useHistory();
  const location = useLocation();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const token = location.state ? location.state.token : location.pathname.replace('/password/verify/', '');

  if (!token) {
    history.push(Routes.root);
  }

  const setNewPassword = async (values) => {
    const eventTag = user.click.newPassword;

    try {
      setSubmitting(true);
      const { status } = await apis.user.setNewPassword({
        token,
        new_password: values.password,
      });
      if (isAPISuccess(status)) {
        setSubmitting(false);
        trackSuccessEvent(eventTag);
        message.success('Password set successfully.');
        history.push(Routes.login);
      }
    } catch (error) {
      setSubmitting(false);
      trackFailedEvent(eventTag, error);
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  return (
    <div className={styles.resetPasswordFormContainer}>
      <div className={styles.resetPasswordHeadingText}>Set your new password</div>
      <div className={styles.resetPasswordForm}>
        <Form form={form} wrapperCol={24} onFinish={setNewPassword}>
          <Item name="password" rules={validationRules.passwordValidation}>
            <Password placeholder="Your new password" />
          </Item>
          <Row justify="center">
            <Col>
              <Button className={styles.submitButton} type="primary" htmlType="submit" loading={submitting}>
                Set Password
              </Button>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
};

export default ResetPassword;
