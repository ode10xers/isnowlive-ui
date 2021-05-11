import React, { useState } from 'react';
import { Row, Col, Form, Typography, Input, Modal, Button } from 'antd';
import Loader from 'components/Loader';
import { showErrorModal, resetBodyStyle, showSuccessModal } from 'components/Modals/modals';
import apis from 'apis';
import { newsletterModalLayout, newsletterFormTailLayout } from 'layouts/FormLayouts';
import classNames from 'classnames';
import validationRules from 'utils/validation';
import { isAPISuccess } from 'utils/helper';
import styles from './style.module.scss';
const { Paragraph, Title } = Typography;

const NewsletterModal = ({ visible, closeModal }) => {
  const [isLoading, setIsLoading] = useState(false);
  const onFinish = async (values) => {
    setIsLoading(true);
    try {
      const payload = {
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
      };

      const { status } = await apis.audiences.sendNewletterSignupDetails(payload);

      if (isAPISuccess(status)) {
        showSuccessModal(
          'Thanks for subscribing!',
          values.firstName + ' ' + values.lastName + ' you have subscribed my newsletter with ' + values.email
        );
        closeModal();
      }
    } catch (error) {
      if (error?.response?.status === 500 && error?.response?.data?.message === 'Email already exist.') {
        showSuccessModal(
          'Thanks for subscribing!',
          values.firstName +
            ' ' +
            values.lastName +
            ' you are already subscribed to my newsletter with ' +
            values.email +
            '.'
        );
        closeModal();
      } else {
        showErrorModal('Error', error?.response?.data?.message || 'Something went wrong, Please try again');
      }
    }

    setIsLoading(false);
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
          <Form labelAlign="right" onFinish={onFinish} scrollToFirstError={true}>
            <Row gutter={8}>
              <Col xs={24}>
                <Paragraph className={styles.textAlignCenter}>
                  <Title level={4}>Subscribe to Newsletter</Title>
                </Paragraph>
              </Col>
              <Col>
                <Form.Item {...newsletterModalLayout} label="Name" className={styles.formBottomMargin} required={true}>
                  <Form.Item
                    name="firstName"
                    rules={validationRules.requiredValidation}
                    className={styles.inlineFormItem}
                  >
                    <Input placeholder="First" />
                  </Form.Item>
                  <Form.Item
                    name="lastName"
                    rules={validationRules.requiredValidation}
                    className={classNames(styles.inlineFormItem, styles.inlineFormItem_lastname)}
                  >
                    <Input placeholder="Last" />
                  </Form.Item>
                </Form.Item>
                <Form.Item
                  {...newsletterModalLayout}
                  label="Email"
                  name="email"
                  rules={validationRules.emailValidation}
                >
                  <Input placeholder="Please Enter your Email" />
                </Form.Item>
                <Form.Item colon={false} {...newsletterFormTailLayout}>
                  <Button block type="primary" htmlType="submit">
                    Subscribe
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
