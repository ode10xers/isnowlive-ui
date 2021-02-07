import React, { useState, useEffect, useRef } from 'react';

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

const { Text, Paragraph, Title } = Typography;

// On special cases, closeModal will take a boolean input
// These cases are for when there are multiple object that
// can trigger the Modal and we need to 'reset' the value
// of the object in the parent component (see SessionDetails)
const PurchaseModal = ({ visible, closeModal, createOrder }) => {
  const { logIn } = useGlobalContext();
  const [form] = Form.useForm();
  const passwordInput = useRef(null);

  const [currentUser, setCurrentUser] = useState(getLocalUserDetails());
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [showSignIn, setShowSignIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [incorrectPassword, setIncorrectPassword] = useState(false);

  const toggleSignInState = () => {
    if (showSignIn) {
      setShowPasswordField(false);
    } else {
      form.setFieldsValue({
        ...form.getFieldsValue(),
        first_name: '',
        last_name: '',
        password: '',
      });
    }

    setIncorrectPassword(false);
    setShowSignIn(!showSignIn);
  };

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
      const user = getLocalUserDetails();
      if (user) {
        if (!currentUser) {
          setCurrentUser(user);
        }

        form.setFieldsValue(user);
        closeModal();
        createOrder(user.email);
      }
    } else {
      document.body.style.overflow = 'auto';
    }
    //eslint-disable-next-line
  }, [form, currentUser, visible]);

  useEffect(() => {
    if (showPasswordField && passwordInput.current) {
      passwordInput.current.focus();
    }
  }, [showPasswordField]);

  const signupUser = async (values) => {
    try {
      const { data } = await apis.user.signup({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        is_creator: false,
      });
      if (data) {
        http.setAuthToken(data.auth_token);
        logIn(data, true);
        closeModal();
        createOrder(values.email);
      }
    } catch (error) {
      if (error.response?.data?.message && error.response.data.message === 'user already exists') {
        setShowPasswordField(true);
        setCurrentUser(values);
        message.info('Enter password to register session');
      } else {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }
  };

  const onFinish = async (values) => {
    setIncorrectPassword(false);
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
            http.setAuthToken(data.auth_token);
            logIn(data, true);
            closeModal();
            createOrder(values.email);
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
      } else {
        closeModal();
        createOrder(values.email);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong');
    }
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
      <Modal visible={visible} centered={true} onCancel={() => closeModal(true)} footer={null}>
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
                  <Title level={4}>{`Sign ${showSignIn ? 'In' : 'Up'} To Continue`}</Title>
                  {`Sign ${showSignIn ? 'In' : 'Up'} to manage all your purchases in your dashboard`}
                </Paragraph>
              </Col>
              <Col xs={24} md={{ span: 18, offset: 3 }}>
                {!showSignIn && (
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
                  <Input placeholder="Enter your email" disabled={!showSignIn && showPasswordField} />
                </Form.Item>
                {(showSignIn || showPasswordField) && (
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
                    {!showSignIn && (
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
                {showSignIn && (
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
                    Sign {showSignIn ? 'In' : 'Up'}
                  </Button>
                </Form.Item>
                <Paragraph className={styles.textAlignCenter}>
                  {showSignIn ? "Don't" : 'Already'} have an account?{' '}
                  <Button className={styles.linkBtn} type="link" onClick={() => toggleSignInState()}>
                    Sign {showSignIn ? 'Up' : 'In'}
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

export default PurchaseModal;
