import React, { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';

import { Row, Col, Form, Input, Typography, Modal, Button, message } from 'antd';

import config from 'config';
import apis from 'apis';

import validationRules from 'utils/validation';
import { getLocalUserDetails } from 'utils/storage';
import { isAPISuccess, scrollToErrorField } from 'utils/helper';

import Loader from 'components/Loader';
import {
  showErrorModal,
  showAlreadyBookedModal,
  showBookingSuccessModal,
  sendNewPasswordEmail,
  showSetNewPasswordModal,
} from 'components/Modals/modals';

import http from 'services/http';
import { useGlobalContext } from 'services/globalContext';

import { purchaseModalFormLayout, purchaseModalTailLayout, purchaseModalCenterLayout } from 'layouts/FormLayouts';

import styles from './style.module.scss';

const stripePromise = loadStripe(config.stripe.secretKey);

const { Text, Paragraph, Title } = Typography;

const PurchasePassModal = ({ visible, closeModal, pass = null }) => {
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
      const user = getLocalUserDetails();
      if (user) {
        if (!currentUser) {
          setCurrentUser(user);
          form.setFieldsValue(user);
        }

        form.setFieldsValue(user);
        createOrder(user.email);
      }
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

  const initiatePaymentForOrder = async (orderDetails) => {
    setIsLoading(true);
    try {
      const { data, status } = await apis.payment.createPaymentSessionForOrder({
        order_id: orderDetails.pass_order_id,
        order_type: 'PASS_ORDER',
      });

      if (isAPISuccess(status) && data) {
        const stripe = await stripePromise;

        const result = await stripe.redirectToCheckout({
          sessionId: data.payment_gateway_session_id,
        });

        if (result.error) {
          message.error('Cannot initiate payment at this time, please try again...');
          setIsLoading(false);
        }
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  const createOrder = async (userEmail) => {
    if (!pass) {
      showErrorModal('Something went wrong', 'Invalid Class Pass ID');
      return;
    }

    setIsLoading(true);
    try {
      const { status, data } = await apis.passes.createOrderForUser({
        pass_id: pass.id,
        price: pass.price,
        currency: pass.currency,
      });

      if (isAPISuccess(status) && data) {
        if (data.payment_required) {
          initiatePaymentForOrder(data);
        } else {
          setIsLoading(false);
          showBookingSuccessModal(userEmail, pass, false, false);
          closeModal();
        }
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong');
      if (error.response?.data?.message === 'user already has a confirmed order for this pass') {
        const username = window.location.hostname.split('.')[0];

        showAlreadyBookedModal(true, username);
        closeModal();
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
      <Modal visible={visible} centered={true} onCancel={() => closeModal()} footer={null}>
        {pass ? (
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
                      <Form.Item
                        className={styles.lastNameInput}
                        name="last_name"
                        rules={validationRules.nameValidation}
                      >
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
        ) : (
          <Text className={styles.textAlignCenter}> Please Select a valid Class Pass </Text>
        )}
      </Modal>
    </div>
  );
};

export default PurchasePassModal;
