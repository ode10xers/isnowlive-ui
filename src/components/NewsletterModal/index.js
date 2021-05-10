import React from 'react';
import { Row, Col, Form, Typography, Input, Modal, Button } from 'antd';
import Loader from 'components/Loader';
import { showErrorModal, resetBodyStyle } from 'components/Modals/modals';
import apis from 'apis';
import { isAPISuccess } from 'utils/helper';
import styles from './style.module.scss';
const { Paragraph, Title } = Typography;

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
        closeModal(true);
      }
    } catch (error) {
      showErrorModal('Error', error?.respoonse?.data?.message || 'Something went wrong, Please try again');
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
          <Form labelAlign="left" onFinish={onFinish} scrollToFirstError={true}>
            <Row gutter={8}>
              <Col xs={24}>
                <Paragraph className={styles.textAlignCenter}>
                  <Title level={4}>{`Subscribe`}</Title>
                  {`Subscribe to my newsletter`}
                </Paragraph>
              </Col>
              <Col xs={24} md={{ span: 18, offset: 3 }}>
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
                    <Input placeholder="Last" />
                  </Form.Item>
                </Form.Item>
                <Form.Item label="Email">
                  <Form.Item name="email" rules={[{ type: 'email' }]}>
                    <Input placeholder="Please Enter your Email" />
                  </Form.Item>
                </Form.Item>
                <Form.Item label=" " colon={false}>
                  <Button type="primary" htmlType="submit">
                    Submit
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Loader>
      </Modal>
    </div>
  );
};

export default NewsletterModal;
