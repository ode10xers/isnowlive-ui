import React, { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';

import { Form, Input, Typography, Modal, Button, message } from 'antd';

import config from 'config';
import Routes from 'routes';
import apis from 'apis';

import dateUtil from 'utils/date';
import validationRules from 'utils/validation';
import { getLocalUserDetails } from 'utils/storage';
import { isAPISuccess, generateUrl, scrollToErrorField } from 'utils/helper';
import { showErrorModal, showSuccessModal } from 'utils/modals';

import http from 'services/http';
import { useGlobalContext } from 'services/globalContext';
import { openFreshChatWidget } from 'services/integrations/fresh-chat';

import { sessionRegistrationformLayout, sessionRegistrationTailLayout } from 'layouts/FormLayouts';

import styles from './style.module.scss';

const stripePromise = loadStripe(config.stripe.secretKey);

const { Text, Paragraph } = Typography;

const {
  timezoneUtils: { getCurrentLongTimezone },
} = dateUtil;

const PurchasePassModal = ({ visible, closeModal, pass = null }) => {
  const { logIn } = useGlobalContext();
  const [form] = Form.useForm();
  const passwordInput = useRef(null);

  const [currentUser, setCurrentUser] = useState(null);
  const [showPasswordField, setShowPasswordField] = useState(false);

  console.log(getCurrentLongTimezone());

  useEffect(() => {
    if (!currentUser) {
      const user = getLocalUserDetails();
      console.log(user);

      if (user) {
        setCurrentUser(user);
        form.setFieldsValue(user);
      }
    } else {
      form.setFieldsValue(currentUser);
    }
  }, [form, currentUser]);

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
    try {
      const { data, status } = await apis.payment.createPaymentSessionForOrder({
        order_id: orderDetails.order_id,
        order_type: 'PASS_ORDER',
      });

      if (isAPISuccess(status) && data) {
        const stripe = await stripePromise;

        const result = await stripe.redirectToCheckout({
          sessionId: data.payment_gateway_session_id,
        });

        if (result.error) {
          message.error('Cannot initiate payment at this time, please try again...');
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  const createOrder = async () => {
    if (!pass) {
      showErrorModal('Something went wrong', 'Invalid Class Pass ID');
      return;
    }

    try {
      console.log(pass);
      const { status, data } = await apis.passes.createOrderForUser({
        pass_id: pass.id,
        price: pass.price,
        currency: pass.currency,
      });

      if (isAPISuccess(status) && data) {
        if (data.payment_required) {
          initiatePaymentForOrder(data);
        } else {
          showSuccessModal('Successfully Purchased Class Pass');
        }
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong');
      if (
        // TODO: Check the error messages for when user tries to purchase an already purchased pass
        error.response?.data?.message === 'It seems you have already booked this session, please check your dashboard'
      ) {
        Modal.warning({
          title: 'Pass Already Purchased',
          content: 'It seems you have already booked this class pass, please check your dashboard',
          okText: 'Go To Dashboard',
          onOk: () => (window.location.href = generateUrl() + Routes.attendeeDashboard.rootPath),
        });
      }
    }

    closeModal();
  };

  const sendNewPasswordEmail = async (email) => await apis.user.sendNewPasswordEmail({ email });

  const handleSendNewPasswordEmail = async (email) => {
    try {
      const { status } = await sendNewPasswordEmail(email);
      if (isAPISuccess(status)) {
        Modal.confirm({
          mask: true,
          center: true,
          closable: true,
          maskClosable: true,
          title: 'Set a new password',
          content: (
            <>
              <Paragraph>
                We have sent you a link to setup your new password on your email <Text strong>{email}</Text>.
              </Paragraph>
              <Paragraph>
                <Button className={styles.linkButton} type="link" onClick={() => sendNewPasswordEmail(email)}>
                  Didn't get it? Send again.
                </Button>
              </Paragraph>
            </>
          ),
          okText: 'Okay',
          cancelText: 'Talk to us',
          onCancel: () => openFreshChatWidget(),
        });
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  const onFinish = async (values) => {
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
          message.error(error.response?.data?.message || 'Something went wrong');
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

  return (
    <div>
      <Modal
        visible={visible}
        centered={true}
        title="Purchase Class Pass"
        onCancel={() => closeModal()}
        width={640}
        footer={null}
      >
        {pass ? (
          <Form
            form={form}
            labelAlign="left"
            {...sessionRegistrationformLayout}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
          >
            <Form.Item label="Name" className={styles.nameInputWrapper}>
              <Form.Item className={styles.nameInput} name="first_name" rules={validationRules.nameValidation}>
                <Input placeholder="First Name" disabled={showPasswordField} />
              </Form.Item>
              <Form.Item className={styles.nameInput} name="last_name" rules={validationRules.nameValidation}>
                <Input placeholder="Last Name" disabled={showPasswordField} />
              </Form.Item>
            </Form.Item>

            <Form.Item className={styles.emailInput} label="Email" name="email" rules={validationRules.emailValidation}>
              <Input placeholder="Enter your email" disabled={showPasswordField} />
            </Form.Item>

            {showPasswordField && (
              <>
                <Form.Item
                  label="Password"
                  name="password"
                  rules={validationRules.passwordValidation}
                  ref={passwordInput}
                >
                  <Input.Password placeholder="Enter your password" />
                </Form.Item>
              </>
            )}

            <Form.Item {...sessionRegistrationTailLayout}>
              <Button type="primary" htmlType="submit">
                Register
              </Button>
            </Form.Item>

            {showPasswordField && (
              <Form.Item {...sessionRegistrationTailLayout}>
                <Button
                  className={styles.linkButton}
                  type="link"
                  onClick={() => handleSendNewPasswordEmail(form.getFieldsValue().email)}
                >
                  Set a new password
                </Button>
              </Form.Item>
            )}
          </Form>
        ) : (
          <Text className={styles.textAlignCenter}> Please Select a valid Class Pass </Text>
        )}
      </Modal>
    </div>
  );
};

export default PurchasePassModal;
