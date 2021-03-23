import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Form, Input, Typography, Modal, Button, message } from 'antd';
import { useTranslation } from 'react-i18next';

import apis from 'apis';

import validationRules from 'utils/validation';
import { getLocalUserDetails } from 'utils/storage';
import { isAPISuccess, scrollToErrorField } from 'utils/helper';

import Loader from 'components/Loader';
import { showErrorModal, sendNewPasswordEmail, showSetNewPasswordModal } from 'components/Modals/modals';

import http from 'services/http';
import { useGlobalContext } from 'services/globalContext';

import { purchaseModalFormLayout, purchaseModalTailLayout, purchaseModalCenterLayout } from 'layouts/FormLayouts';

import styles from './style.module.scss';

const { Paragraph, Title, Text } = Typography;

const HeaderModal = ({ visible, closeModal, signingIn = true, toggleSigningIn }) => {
  const { t } = useTranslation();
  const { logIn } = useGlobalContext();
  const history = useHistory();
  const [form] = Form.useForm();
  const passwordInput = useRef(null);

  const [showPasswordField, setShowPasswordField] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [incorrectPassword, setIncorrectPassword] = useState(false);

  useEffect(() => {
    if (showPasswordField && passwordInput.current) {
      passwordInput.current.focus();
    }
  }, [showPasswordField]);

  useEffect(() => {
    setIncorrectPassword(false);
  }, [toggleSigningIn]);

  const signinUser = (data) => {
    http.setAuthToken(data.auth_token);
    logIn(data, true);
    message.success(t('YOU_HAVE_LOGGED_IN'));

    const user_type = data.is_creator ? 'creator' : 'attendee';
    history.push(`/${user_type}/dashboard/sessions/upcoming`);
    window.scrollTo(0, 0);
    closeModal();
  };

  const signupUser = async (values) => {
    setIsLoading(true);
    try {
      const { data } = await apis.user.signup({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        is_creator: false,
      });
      if (data) {
        signinUser(data);
      }
    } catch (error) {
      if (error.response?.data?.message && error.response.data.message === 'user already exists') {
        setShowPasswordField(true);
        message.info(t('ENTER_PASSWORD'));
      } else {
        message.error(error.response?.data?.message || t('SOMETHING_WENT_WRONG'));
      }
    }
    setIsLoading(false);
  };

  const onFinish = async (values) => {
    setIsLoading(true);

    try {
      // check if user is login

      // NOTE: Reason the check have getLocalUserDetails() and not currentUser
      // is beause if user aleady existing and have to login then value will be
      // set to currentUser where as getLocalUserDetails is only set if user has
      // actually login
      if (!getLocalUserDetails() && values.password) {
        try {
          const { data } = await apis.user.login({
            email: values.email,
            password: values.password,
          });

          if (data) {
            signinUser(data);
          }
        } catch (error) {
          if (error.response?.status === 403) {
            setIncorrectPassword(true);
            message.error(t('INCORRECT_EMAIL_OR_PASSWORD'));
          } else {
            message.error(error.response?.data?.message || t('SOMETHING_WENT_WRONG'));
          }
        }
      } else if (!getLocalUserDetails()) {
        signupUser(values);
      }
    } catch (error) {
      message.error(error.response?.data?.message || t('SOMETHING_WENT_WRONG'));
    }
    setIsLoading(false);
  };

  const onFinishFailed = ({ errorFields }) => {
    scrollToErrorField(errorFields);
  };

  const handleSetNewPassword = async () => {
    try {
      const values = await form.validateFields(['email']);
      handleSendNewPasswordEmail(values.email);
    } catch (error) {
      showErrorModal(t('MISSING_EMAIL_ERROR_TEXT'));
    }
  };

  const handleSendNewPasswordEmail = async (email) => {
    try {
      setIsLoading(true);
      const { status } = await sendNewPasswordEmail(email);
      if (isAPISuccess(status)) {
        setIsLoading(false);
        showSetNewPasswordModal(email);
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || t('SOMETHING_WENT_WRONG'));
    }
  };

  return (
    <div>
      <Modal visible={visible} centered={true} onCancel={() => closeModal()} footer={null}>
        <Loader loading={isLoading}>
          <Form
            form={form}
            labelAlign="left"
            {...purchaseModalFormLayout}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
          >
            <Row gutter={[8, 8]}>
              <Col xs={24}>
                <Paragraph className={styles.textAlignCenter}>
                  <Title level={4}>{`${signingIn ? t('SIGN_IN') : t('SIGN_UP')} ${t('HEADER_MODAL_TITLE_1')}`}</Title>
                  {`${signingIn ? t('SIGN_IN') : t('SIGN_UP')} ${t('HEADER_MODAL_TEXT_1')}`}
                </Paragraph>
              </Col>
              <Col xs={24} md={{ span: 18, offset: 3 }}>
                {!signingIn && (
                  <Form.Item label={t('NAME')} className={styles.nameInputWrapper}>
                    <Form.Item
                      className={styles.firstNameInput}
                      name="first_name"
                      rules={validationRules.nameValidation}
                    >
                      <Input placeholder={t('FIRST_NAME')} disabled={showPasswordField} />
                    </Form.Item>
                    <Form.Item className={styles.lastNameInput} name="last_name" rules={validationRules.nameValidation}>
                      <Input placeholder={t('LAST_NAME')} disabled={showPasswordField} />
                    </Form.Item>
                  </Form.Item>
                )}
                <Form.Item label={t('EMAIL')} name="email" rules={validationRules.emailValidation}>
                  <Input placeholder={t('ENTER_YOUR_EMAIL')} disabled={!signingIn && showPasswordField} />
                </Form.Item>
                {(signingIn || showPasswordField) && (
                  <>
                    <Form.Item label={t('PASSWORD')} name="password" rules={validationRules.passwordValidation}>
                      <Input.Password placeholder={t('ENTER_PASSWORD')} />
                    </Form.Item>
                    {incorrectPassword && (
                      <Form.Item {...purchaseModalTailLayout}>
                        <div className={styles.incorrectPasswordText}>
                          <Text type="danger"> {t('HEADER_MODAL_LOGIN_ERROR_TEXT')} </Text>
                        </div>
                      </Form.Item>
                    )}
                    {!signingIn && (
                      <Form.Item {...purchaseModalTailLayout}>
                        <div className={styles.passwordHelpText}>
                          <Text>
                            {t('HEADER_MODAL_SIGN_UP_HELP_TEXT_1')}{' '}
                            <Text className={styles.linkBtn} onClick={() => handleSetNewPassword()}>
                              {t('SET_NEW_PASSWORD').toLowerCase()}
                            </Text>
                          </Text>
                        </div>
                      </Form.Item>
                    )}
                  </>
                )}
                {signingIn && (
                  <Form.Item {...purchaseModalCenterLayout}>
                    <Button className={styles.linkBtn} type="link" onClick={() => handleSetNewPassword()}>
                      {t('SET_NEW_PASSWORD')}
                    </Button>
                  </Form.Item>
                )}
              </Col>
              <Col xs={24} md={{ span: 18, offset: 3 }}>
                <Form.Item {...purchaseModalCenterLayout}>
                  <Button block type="primary" htmlType="submit">
                    {signingIn ? t('SIGN_IN') : t('SIGN_UP')}
                  </Button>
                </Form.Item>
                <Paragraph className={styles.textAlignCenter}>
                  {signingIn ? t('DONT_HAVE_AN_ACCOUNT') : t('ALREADY_HAVE_AN_ACCOUNT')}{' '}
                  <Button className={styles.linkBtn} type="link" onClick={() => toggleSigningIn()}>
                    {signingIn ? t('SIGN_UP') : t('SIGN_IN')}
                  </Button>
                </Paragraph>
              </Col>
            </Row>
          </Form>
        </Loader>
      </Modal>
    </div>
  );
};

export default HeaderModal;
