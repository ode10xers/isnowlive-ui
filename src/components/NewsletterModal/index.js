import React from 'react';
import { Row, Col, Form, Input, Modal, Button, Space } from 'antd';
import Loader from 'components/Loader';
import { showErrorModal, resetBodyStyle } from 'components/Modals/modals';
import apis from 'apis';
import { isAPISuccess } from 'utils/helper';

const NewsletterModal = ({ visible, closeModal, isLoading }) => {
  const onFinish = async (values) => {
    console.log('Received values of form: ', values);
    try {
      const payload = {
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
      };

      const { status } = await apis.audiences.sendNewletterSignupDetails(payload);

      if (isAPISuccess(status)) {
        console.log('success');
      }
    } catch (error) {
      showErrorModal('Failed to send emails', error?.respoonse?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div>
      <Modal
        visible={visible}
        centered={true}
        onCancel={() => closeModal(true)}
        footer={null}
        afterClose={resetBodyStyle}
      >
        <Loader loading={isLoading} size="large">
          <Form name="complex-form" onFinish={onFinish} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }}>
            <Form.Item label="Name" style={{ marginBottom: 0 }}>
              <Form.Item
                name="firstName"
                rules={[{ required: true }]}
                style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}
              >
                <Input placeholder="First" />
              </Form.Item>
              <Form.Item
                name="lastName"
                rules={[{ required: true }]}
                style={{ display: 'inline-block', width: 'calc(50% - 8px)', margin: '0 8px' }}
              >
                <Input placeholder="Last1" />
              </Form.Item>
            </Form.Item>
            <Form.Item label="Email">
              <Space>
                <Form.Item name="email" noStyle rules={[{ type: 'email' }]}>
                  <Input placeholder="Please Enter your Email" />
                </Form.Item>
              </Space>
            </Form.Item>
            <Form.Item label=" " colon={false}>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Loader>
      </Modal>
    </div>
  );
};

export default NewsletterModal;
