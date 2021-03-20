import React, { useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Form, Input, Button, Row, Col, message } from 'antd';
import { useTranslation } from 'react-i18next';

import Routes from 'routes';
import apis from 'apis';
import validationRules from 'utils/validation';
import { isAPISuccess } from 'utils/helper';
import { formLayout, formTailLayout } from 'layouts/FormLayouts';
import { mixPanelEventTags, trackSuccessEvent, trackFailedEvent } from 'services/integrations/mixpanel';

import styles from './style.module.scss';

const { Item } = Form;
const { Password } = Input;
const { user } = mixPanelEventTags;

const ResetPassword = () => {
  const { t: translate } = useTranslation();
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
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
    }
  };

  return (
    <Row align="middle" className={styles.mt50}>
      <Col xs={24} md={{ span: 12, offset: 6 }}>
        <Row>
          <Col xs={24} md={{ span: 16, offset: 4 }}>
            <h1>Set a new password</h1>
          </Col>
        </Row>

        <Form form={form} {...formLayout} name="basic" onFinish={setNewPassword}>
          <Item label="Password" name="password" rules={validationRules.passwordValidation}>
            <Password />
          </Item>
          <Item {...formTailLayout}>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Set Password
            </Button>
          </Item>
        </Form>
      </Col>
    </Row>
  );
};

export default ResetPassword;
