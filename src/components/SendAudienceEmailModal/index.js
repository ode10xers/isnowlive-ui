import React, { useState, useEffect } from 'react';

import { Row, Col, Modal, Form, Input, Tooltip, Button, Select, Typography } from 'antd';
import { FilePdfOutlined, CloseCircleOutlined } from '@ant-design/icons';

import apis from 'apis';

import TextEditor from 'components/TextEditor';
import FileUpload from 'components/FileUpload';
import { showSuccessModal, showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import validationRules from 'utils/validation';
import { getLocalUserDetails } from 'utils/storage';

import { sendCustomerEmailFormLayout, sendCustomerEmailBodyFormLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const formInitialValues = {
  recipients: [],
  subject: '',
};

// The functionality is very similar to SendCustomerEmailModal
// But the data is handled differently since Audience is a different entity
// Also SendCustomerEmail requires some product information while this one does not
const SendAudienceEmailModal = ({ visible, closeModal, recipients }) => {
  const [form] = Form.useForm();

  const [submitting, setSubmitting] = useState(false);
  const [validRecipients, setValidRecipients] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [emailDocumentUrl, setEmailDocumentUrl] = useState(null);

  useEffect(() => {
    if (visible && recipients.length > 0) {
      setValidRecipients(recipients);
      setSelectedRecipients(recipients.map((recipient) => recipient.id));
      form.setFieldsValue({
        recipients: recipients.map((recipient) => recipient.id),
      });
    } else {
      form.resetFields();
      setEmailDocumentUrl(null);
      setSelectedRecipients([]);
      setValidRecipients([]);
      setSubmitting(false);
    }
  }, [visible, form, recipients]);

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  const handleFinish = async (values) => {
    setSubmitting(true);

    try {
      const payload = {
        body: values.emailBody,
        subject: values.subject,
        audiences: selectedRecipients || values.recipients,
        document_url: emailDocumentUrl || '',
      };

      const { status } = await apis.audiences.sendEmailToAudiences(payload);

      if (isAPISuccess(status)) {
        showSuccessModal('Emails sent successfully');
        closeModal();
      }
    } catch (error) {
      showErrorModal('Failed to send emails', error?.respoonse?.data?.message || 'Something went wrong');
    }

    setSubmitting(false);
  };

  return (
    <Modal
      title={<Title level={5}> Send email to audiences </Title>}
      visible={visible}
      centered={true}
      onCancel={() => closeModal()}
      footer={null}
      width={640}
    >
      <Form
        layout="horizontal"
        name="emailForm"
        form={form}
        onFinish={handleFinish}
        scrollToFirstError={true}
        initialValues={formInitialValues}
      >
        <Row gutter={[8, 16]}>
          <Col xs={24}>
            <Form.Item {...sendCustomerEmailFormLayout} label="Replies will be sent to">
              <Text strong> {getLocalUserDetails().email} </Text>
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              {...sendCustomerEmailFormLayout}
              id="recipients"
              name="recipients"
              label="Recipients"
              rules={validationRules.arrayValidation}
            >
              <Select
                showArrow
                showSearch
                placeholder="Select the recipients"
                mode="multiple"
                maxTagCount={3}
                values={selectedRecipients}
                onChange={(val) => setSelectedRecipients(val)}
                options={validRecipients.map((recipient) => ({
                  label: `${recipient.first_name} ${recipient.last_name || ''}`,
                  value: recipient.id,
                }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              {...sendCustomerEmailFormLayout}
              id="subject"
              name="subject"
              label="Email Subject"
              rules={validationRules.requiredValidation}
            >
              <Input placeholder="Subject of the email goes here" />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              {...sendCustomerEmailBodyFormLayout}
              label="Email Body"
              name="emailBody"
              id="emailBody"
              rules={validationRules.requiredValidation}
            >
              <TextEditor name="emailBody" form={form} placeholder="Content of the email goes here" />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="document_url" id="document_url" valuePropName="fileList" getValueFromEvent={normFile}>
              <Row>
                <Col>
                  <FileUpload
                    name="document_url"
                    value={emailDocumentUrl}
                    onChange={setEmailDocumentUrl}
                    listType="text"
                    label="Upload a PDF file"
                  />
                </Col>
                {emailDocumentUrl && (
                  <Col>
                    <Button
                      type="text"
                      icon={<FilePdfOutlined />}
                      size="middle"
                      onClick={() => window.open(emailDocumentUrl)}
                      className={styles.filenameButton}
                    >
                      {emailDocumentUrl.split('_').slice(-1)[0]}
                    </Button>
                    <Tooltip title="Remove this file">
                      <Button
                        danger
                        type="text"
                        size="middle"
                        icon={<CloseCircleOutlined />}
                        onClick={() => setEmailDocumentUrl(null)}
                      />
                    </Tooltip>
                  </Col>
                )}
              </Row>
            </Form.Item>
          </Col>
        </Row>
        <Row justify="end" align="center" gutter={16}>
          <Col xs={12} md={6}>
            <Button block type="default" onClick={() => closeModal()} loading={submitting}>
              Cancel
            </Button>
          </Col>
          <Col xs={12} md={6}>
            <Button block type="primary" htmlType="submit" loading={submitting}>
              Send Email
            </Button>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default SendAudienceEmailModal;
