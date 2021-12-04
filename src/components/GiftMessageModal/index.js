import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Button, Typography, Spin, Modal, Form, Input, message } from 'antd';

import Routes from 'routes';

import { resetBodyStyle, showErrorModal } from 'components/Modals/modals';

import { orderType } from 'utils/constants';
import validationRules from 'utils/validation';
import { getGiftOrderData, getGiftReceiverData, removeGiftOrderData, removeGiftReceiverData } from 'utils/storage';

import { useGlobalContext } from 'services/globalContext';
import apis from 'apis';
import { generateUrlFromUsername, getUsernameFromUrl } from 'utils/url';
import { isAPISuccess } from 'utils/helper';
import { generatePath } from 'react-router-dom';

const formInitialValues = {
  subject: `Hey there! Here's a gift for you!`,
  body: 'I bought you a gift in Passion.do!',
};

const { Title, Paragraph } = Typography;

const GiftMessageModal = () => {
  const [form] = Form.useForm();

  const {
    state: { giftModalVisible, userDetails },
    hideGiftMessageModal,
  } = useGlobalContext();

  const [isLoading, setIsLoading] = useState(false);
  const [receiverData, setReceiverData] = useState(null);

  const getButtonUrlForOrder = useCallback((orderData) => {
    let targetPath = Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.dashboardPage;

    switch (orderData.order_type) {
      case orderType.CLASS:
        targetPath =
          Routes.attendeeDashboard.rootPath +
          generatePath(Routes.attendeeDashboard.sessions, { session_type: 'upcoming' });
        break;
      case orderType.VIDEO:
        targetPath = Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.videos;
        break;

      case orderType.COURSE:
        targetPath = Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.courses;
        break;

      case orderType.PASS:
        targetPath = Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.passes;
        break;

      default:
        targetPath = Routes.attendeeDashboard.rootPath + Routes.attendeeDashboard.dashboardPage;
        break;
    }

    return generateUrlFromUsername(getUsernameFromUrl()) + targetPath;
  }, []);

  useEffect(() => {
    if (giftModalVisible) {
      const localStorageReceiverData = getGiftReceiverData();

      if (localStorageReceiverData) {
        setReceiverData(localStorageReceiverData);
      }
    } else {
      setReceiverData(null);
      removeGiftReceiverData();
      removeGiftOrderData();
    }
  }, [giftModalVisible]);

  useEffect(() => {
    if (receiverData) {
      form.setFieldsValue({
        subject: `Hi ${receiverData.first_name ?? ''}! You have received a gift from ${userDetails.first_name ?? ''} ${
          userDetails.last_name ?? ''
        }`,
        body: `${userDetails.first_name ?? ''} has bought you a gift in Passion.do!`,
      });
    } else {
      form.resetFields();
    }
  }, [receiverData, form, userDetails]);

  const handleFormFinish = async (values) => {
    if (!receiverData) {
      message.error('No Gift Receiver Data found!');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...values,
        url: getButtonUrlForOrder(getGiftOrderData()),
        user_id: receiverData.external_id,
      };

      const { status } = await apis.user.sendGiftMessage(payload);

      if (isAPISuccess(status)) {
        message.success('Your message has been successfully sent!');
        hideGiftMessageModal();
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to send gift message!', error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  };

  return (
    <Modal
      title={<Title level={5}>Send a message</Title>}
      visible={giftModalVisible}
      closable={true}
      centered={true}
      footer={null}
      afterClose={resetBodyStyle}
      onCancel={hideGiftMessageModal}
      width={640}
    >
      <Spin spinning={isLoading} tip="Processing...">
        <Form
          form={form}
          scrollToFirstError={true}
          onFinish={handleFormFinish}
          initialValues={formInitialValues}
          layout="vertical"
        >
          <Row gutter={[8, 8]}>
            <Col xs={24}>
              <Paragraph>Send a message along with the gift and keep in touch!</Paragraph>
            </Col>
            <Col xs={24}>
              <Form.Item label="Message subject" name="subject" rules={validationRules.requiredValidation}>
                <Input placeholder="Your message subject" maxLength={120} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Message body" name="body" rules={validationRules.requiredValidation}>
                <Input.TextArea
                  placeholder="Your message body"
                  allowClear={true}
                  showCount={true}
                  autoSize={{
                    minRows: 3,
                    maxRows: 10,
                  }}
                  maxLength={300}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Row justify="center">
                <Col>
                  <Button type="primary" size="large" htmlType="submit">
                    Submit
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Form>
      </Spin>
    </Modal>
  );
};

export default GiftMessageModal;
