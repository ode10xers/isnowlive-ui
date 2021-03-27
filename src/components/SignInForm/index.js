import React, { useState } from 'react';
import classNames from 'classnames';
import { Form, Row, Col, Input, Typography, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';

import apis from 'apis';

import http from 'services/http';
import { useGlobalContext } from 'services/globalContext';

import { scrollToErrorField } from 'utils/helper';
import validationRules from 'utils/validation';

import styles from './style.module.scss';
import { showErrorModal } from 'components/Modals/modals';

import { signInFormLayout, signInTailLayout } from 'layouts/FormLayouts';

const { Title, Text } = Typography;

const SignInForm = ({ user, hideSignInForm, onSetNewPassword }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { logIn } = useGlobalContext();
  const [incorrectPassword, setIncorrectPassword] = useState(false);

  const handleSetNewPassword = async () => {
    try {
      const values = await form.validateFields(['email']);
      onSetNewPassword(values.email);
    } catch (error) {
      showErrorModal(t('MISSING_EMAIL_ERROR_TEXT'));
    }
  };

  const onFinish = async (values) => {
    setIncorrectPassword(false);
    if (user) {
      showErrorModal(t('ALREADY_SIGNED_IN'));
      return;
    }

    try {
      const { data } = await apis.user.login({
        email: values.email,
        password: values.password,
      });

      if (data) {
        http.setAuthToken(data.auth_token);
        logIn(data, true);
        hideSignInForm();
      }
    } catch (error) {
      if (error.response?.status === 403) {
        setIncorrectPassword(true);
        message.error(t('INCORRECT_EMAIL_OR_PASSWORD'));
      } else {
        showErrorModal(t('SOMETHING_WENT_WRONG'), error.response?.data?.message);
      }
    }
  };

  const onFinishFailed = ({ errorFields }) => {
    scrollToErrorField(errorFields);
  };

  return (
    <div className={classNames(styles.box, styles.p50, styles.mb20)}>
      <Row>
        <Col xs={24} md={24}>
          <Title level={3}> {t('SIGN_IN')} </Title>
        </Col>
        <Col xs={24} md={24}>
          <Text>{t('HAVE_AN_ACCOUNT_PLEASE_SIGN_IN')}</Text>
        </Col>
        <Col xs={24} md={24} className={styles.mt10}>
          <Form form={form} labelAlign="left" onFinish={onFinish} onFinishFailed={onFinishFailed} {...signInFormLayout}>
            <Form.Item label={t('EMAIL')} name="email" rules={validationRules.emailValidation}>
              <Input className={styles.signInInput} placeholder={t('ENTER_YOUR_EMAIL')} />
            </Form.Item>
            <Form.Item label={t('PASSWORD')} name="password" rules={validationRules.passwordValidation}>
              <Input.Password className={styles.signInInput} placeholder={t('ENTER_PASSWORD')} />
            </Form.Item>
            {incorrectPassword && (
              <Form.Item {...signInTailLayout}>
                <Text type="danger">{t('HEADER_MODAL_LOGIN_ERROR_TEXT')}</Text>
              </Form.Item>
            )}
            <Form.Item {...signInTailLayout}>
              <Button className={styles.linkBtn} type="link" onClick={() => handleSetNewPassword()}>
                {t('SET_NEW_PASSWORD')}
              </Button>
            </Form.Item>
            <Form.Item {...signInTailLayout}>
              <Row>
                <Col xs={24} xl={6}>
                  <Button size="large" type="primary" htmlType="submit">
                    {t('SIGN_IN')}
                  </Button>
                </Col>
                <Col xs={24} xl={18}>
                  <Button className={styles.linkBtn} type="link" onClick={() => hideSignInForm()}>
                    {t('DONT_HAVE_ACCOUNT_REGISTER_NOW')}
                  </Button>
                </Col>
              </Row>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
};

export default SignInForm;
