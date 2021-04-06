import React, { useState, useEffect, useRef } from 'react';

import { Row, Col, Form, Input, Typography, Modal, Button, message } from 'antd';

import apis from 'apis';

import validationRules from 'utils/validation';
import { getLocalUserDetails } from 'utils/storage';
import { isAPISuccess, scrollToErrorField } from 'utils/helper';

import Loader from 'components/Loader';
import TermsAndConditionsText from 'components/TermsAndConditionsText';
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

//TODO: The logics here have been improved based on Rahul's feedback
// Either also apply it into HeaderModal Component
// Or merge it with HeaderModal and refactor them into one component
const PurchaseModal = ({ visible, closeModal, createOrder }) => {
  const { logIn } = useGlobalContext();
  const [form] = Form.useForm();
  const passwordInput = useRef(null);

  const [currentUser, setCurrentUser] = useState(getLocalUserDetails());
  const [showPasswordHelperText, setShowPasswordHelperText] = useState(false);
  const [showSignIn, setShowSignIn] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [incorrectPassword, setIncorrectPassword] = useState(false);
  const [legalsAgreed, setLegalsAgreed] = useState(true);
  const [showLegalsErrorMessage, setShowLegalsErrorMessage] = useState(false);

  const toggleSignInState = () => {
    setShowLegalsErrorMessage(false);
    if (showSignIn) {
      setShowPasswordHelperText(false);
      setLegalsAgreed(false);
    } else {
      setLegalsAgreed(true);
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
        setLegalsAgreed(true);
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
    if (showPasswordHelperText && passwordInput.current) {
      passwordInput.current.focus();
    }
  }, [showPasswordHelperText]);

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
        setShowPasswordHelperText(true);
        setCurrentUser(values);
        setShowSignIn(true);
        message.info('You already have an account! Enter password to register session');
      } else {
        message.error(error.response?.data?.message || 'Something went wrong');
      }
    }
  };

  const onFinish = async (values) => {
    setShowLegalsErrorMessage(false);
    setIncorrectPassword(false);

    if (!legalsAgreed) {
      setShowLegalsErrorMessage(true);
      return;
    }

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
            http.setAuthToken(data.auth_token);
            logIn(data, true);
            closeModal();
            createOrder(values.email);
          }
        } catch (error) {
          if (error.response?.status === 403) {
            //TODO: Match the status code or message if BE changes it
            if (
              error.response?.data?.message ===
              'unable to find user for email. Error: unable to find user with email: record not found'
            ) {
              toggleSignInState();
              message.error('No account with that email exists! Sign up to create new account');
            } else {
              setIncorrectPassword(true);
              message.error('Incorrect email or password');
            }
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
      <Modal visible={visible} centered={true} onCancel={() => closeModal(true)} footer={null}>
        <Loader loading={isLoading} size="large">
          <Form
            form={form}
            labelAlign="left"
            {...purchaseModalFormLayout}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
          >
            <Row gutter={8}>
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
                      <Input placeholder="First Name" disabled={showPasswordHelperText} />
                    </Form.Item>
                    <Form.Item className={styles.lastNameInput} name="last_name" rules={validationRules.nameValidation}>
                      <Input placeholder="Last Name" disabled={showPasswordHelperText} />
                    </Form.Item>
                  </Form.Item>
                )}
                <Form.Item label="Email" name="email" rules={validationRules.emailValidation}>
                  <Input placeholder="Enter your email" />
                </Form.Item>
                {showSignIn && (
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
                    {showPasswordHelperText && (
                      <Form.Item {...purchaseModalTailLayout}>
                        <div className={styles.passwordHelpText}>
                          <Text>
                            You already have an account, but if you haven't set your password, please{' '}
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
              {showLegalsErrorMessage && (
                <Col xs={24} className={styles.textAlignCenter}>
                  <Text type="danger" className={styles.smallText}>
                    To proceed, you need to check the checkbox below
                  </Text>
                </Col>
              )}
              <Col xs={24} md={{ span: 18, offset: 3 }}>
                <TermsAndConditionsText
                  shouldCheck={true}
                  isChecked={legalsAgreed}
                  setChecked={(checked) => setLegalsAgreed(checked)}
                />
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
