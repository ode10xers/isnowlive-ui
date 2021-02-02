import React, { useState, useEffect, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { Row, Col, Form, Input, Typography, Modal, Button, message } from 'antd';

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
    message.success('You have logged in');
    history.push('/attendee/dashboard/sessions/upcoming');
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
        message.info('Enter password to register session');
      } else {
        message.error(error.response?.data?.message || 'Something went wrong');
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
            message.error('Incorrect email or password');
          } else {
            message.error(error.response?.data?.message || 'Something went wrong');
          }
        }
      } else if (!getLocalUserDetails()) {
        signupUser(values);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong');
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
      showErrorModal('Please input your email first!');
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
      message.error(error.response?.data?.message || 'Something went wrong.');
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
                  <Title level={4}>{`Sign ${signingIn ? 'In' : 'Up'} To Continue`}</Title>
                  {`Sign ${signingIn ? 'In' : 'Up'} to manage all your purchases in your dashboard`}
                </Paragraph>
              </Col>
              <Col xs={24} md={{ span: 18, offset: 3 }}>
                {!signingIn && (
                  <Form.Item label="Name" className={styles.nameInputWrapper}>
                    <Form.Item
                      className={styles.firstNameInput}
                      name="first_name"
                      rules={validationRules.nameValidation}
                    >
                      <Input placeholder="First Name" disabled={showPasswordField} />
                    </Form.Item>
                    <Form.Item className={styles.lastNameInput} name="last_name" rules={validationRules.nameValidation}>
                      <Input placeholder="Last Name" disabled={showPasswordField} />
                    </Form.Item>
                  </Form.Item>
                )}
                <Form.Item label="Email" name="email" rules={validationRules.emailValidation}>
                  <Input placeholder="Enter your email" disabled={!signingIn && showPasswordField} />
                </Form.Item>
                {(signingIn || showPasswordField) && (
                  <>
                    <Form.Item label="Password" name="password" rules={validationRules.passwordValidation}>
                      <Input.Password placeholder="Enter your password" />
                    </Form.Item>
                    {incorrectPassword && (
                      <Form.Item {...purchaseModalTailLayout}>
                        <div className={styles.incorrectPasswordText}>
                          <Text type="danger">Email or password you entered was incorrect, please try again</Text>
                        </div>
                      </Form.Item>
                    )}
                    {!signingIn && (
                      <Form.Item {...purchaseModalTailLayout}>
                        <div className={styles.passwordHelpText}>
                          <Text>
                            You have booked a session with us earlier, but if you haven't set your password, please{' '}
                            <Text className={styles.linkBtn} onClick={() => handleSetNewPassword()}>
                              set a new password
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
                      Set a new password
                    </Button>
                  </Form.Item>
                )}
              </Col>
              <Col xs={24} md={{ span: 18, offset: 3 }}>
                <Form.Item {...purchaseModalCenterLayout}>
                  <Button block type="primary" htmlType="submit">
                    Sign {signingIn ? 'In' : 'Up'}
                  </Button>
                </Form.Item>
                <Paragraph className={styles.textAlignCenter}>
                  {signingIn ? "Don't" : 'Already'} have an account?{' '}
                  <Button className={styles.linkBtn} type="link" onClick={() => toggleSigningIn()}>
                    Sign {signingIn ? 'Up' : 'In'}
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
