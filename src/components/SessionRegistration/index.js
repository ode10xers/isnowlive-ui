import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Row, Col, Button, Form, Input, Typography } from 'antd';

import Routes from 'routes';

import validationRules from 'utils/validation';
import { generateUrlFromUsername, scrollToErrorField } from 'utils/helper';
import { sessionRegistrationformLayout, sessionRegistrationTailLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const { Item } = Form;
const { Password } = Input;

const SessionRegistration = ({ onFinish, showPasswordField, user, onSetNewPassword }) => {
  const [form] = Form.useForm();
  const passwordInput = useRef(null);

  useEffect(() => {
    if (user) {
      form.setFieldsValue(user);
    }
  }, [user, form]);

  useEffect(() => {
    if (showPasswordField && passwordInput.current) {
      passwordInput.current.focus();
    }
  }, [showPasswordField]);

  const onFinishFailed = ({ errorFields }) => {
    scrollToErrorField(errorFields);
  };

  return (
    <div className={classNames(styles.box, styles.p50)}>
      <Row>
        <Col xs={24} md={24}>
          <Title level={3}>Registration</Title>
        </Col>
        <Col xs={24} md={24}>
          <Text>
            <a href="https://zoom.us/download"> Zoom </a> details to join will be sent over email and are always
            available in your
            <a href={`${generateUrlFromUsername('app')}${Routes.attendeeDashboard.defaultPath}`}> dashboard </a>.
          </Text>
        </Col>
        <Col xs={24} md={24} className={styles.mt10}>
          <Form
            form={form}
            labelAlign="left"
            {...sessionRegistrationformLayout}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
          >
            <Item label="Name" className={styles.nameInputWrapper}>
              <Item className={styles.nameInput} name="first_name" rules={validationRules.nameValidation}>
                <Input placeholder="First Name" disabled={showPasswordField} />
              </Item>
              <Item className={styles.nameInput} name="last_name" rules={validationRules.nameValidation}>
                <Input placeholder="Last Name" disabled={showPasswordField} />
              </Item>
            </Item>

            <Item className={styles.emailInput} label="Email" name="email" rules={validationRules.emailValidation}>
              <Input placeholder="Enter your email" disabled={showPasswordField} />
            </Item>

            {showPasswordField && (
              <>
                <Item
                  extra={
                    <Text disabled>
                      If you have booked a session with us earlier but haven't set your password, please use the{' '}
                      <a href onClick={() => onSetNewPassword(form.getFieldsValue().email)}>
                        set new password
                      </a>{' '}
                      option below{' '}
                    </Text>
                  }
                  label="Password"
                  name="password"
                  rules={validationRules.passwordValidation}
                  ref={passwordInput}
                >
                  <Password />
                </Item>
              </>
            )}

            <Item {...sessionRegistrationTailLayout}>
              <Button type="primary" htmlType="submit">
                Register
              </Button>
            </Item>

            {showPasswordField && (
              <Item {...sessionRegistrationTailLayout}>
                <a href onClick={() => onSetNewPassword(form.getFieldsValue().email)}>
                  Set a new password
                </a>
              </Item>
            )}
          </Form>
        </Col>
      </Row>
    </div>
  );
};

SessionRegistration.defaultProps = {
  user: {},
};

SessionRegistration.propTypes = {
  onFinish: PropTypes.func.isRequired,
  showPasswordField: PropTypes.bool.isRequired,
  user: PropTypes.object,
  onSetNewPassword: PropTypes.func.isRequired,
};

export default SessionRegistration;
