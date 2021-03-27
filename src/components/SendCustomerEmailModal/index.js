import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Row, Col, Form, Modal, Tooltip, Input, Select, Typography, Button } from 'antd';
import { FilePdfOutlined, CloseCircleOutlined } from '@ant-design/icons';

import apis from 'apis';

import FileUpload from 'components/FileUpload';
import TextEditor from 'components/TextEditor';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { isAPISuccess } from 'utils/helper';

import { sendCustomerEmailFormLayout, sendCustomerEmailBodyFormLayout } from 'layouts/FormLayouts';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const formInitialValues = {
  recipients: [],
  subject: '',
};

const SendCustomerEmailModal = () => {
  const { t } = useTranslation();

  const {
    state: { emailPopupVisible, emailPopupData },
    hideSendEmailPopup,
  } = useGlobalContext();

  const { recipients, productId, productType } = emailPopupData;

  const [form] = Form.useForm();

  const [submitting, setSubmitting] = useState(false);
  const [validRecipients, setValidRecipients] = useState({
    active: [],
    expired: [],
  });
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [emailDocumentUrl, setEmailDocumentUrl] = useState(null);

  useEffect(() => {
    if (!emailPopupVisible || (recipients?.active?.length < 1 && recipients?.expired?.length < 1)) {
      setSubmitting(false);
      setValidRecipients({
        active: [],
        expired: [],
      });
      setSelectedRecipients([]);
      setEmailDocumentUrl(null);

      form.resetFields();
    } else {
      setValidRecipients(recipients);
      setSelectedRecipients([
        ...recipients?.active?.map((user) => user.external_id),
        ...recipients?.expired?.map((user) => user.external_id),
      ]);

      form.setFieldsValue({
        recipients: [
          ...recipients?.active?.map((user) => user.external_id),
          ...recipients?.expired?.map((user) => user.external_id),
        ],
      });
    }
  }, [emailPopupVisible, recipients, form]);

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
        product_id: productId,
        product_type: productType,
        body: values.emailBody,
        subject: values.subject,
        user_ids: selectedRecipients || values.recipients,
        document_url: emailDocumentUrl || '',
      };

      const { status } = await apis.user.sendProductEmailToCustomers(payload);

      if (isAPISuccess(status)) {
        showSuccessModal(t('EMAILS_SENT'));
        hideSendEmailPopup();
      }
    } catch (error) {
      showErrorModal(t('FAILED_TO_SEND_EMAILS'), error?.response?.data?.message || t('SOMETHING_WENT_WRONG'));
    }

    setSubmitting(false);
  };

  return (
    <Modal
      title={<Title level={5}> {t('SEND_CUSTOMER_EMAIL')} </Title>}
      visible={emailPopupVisible}
      centered={true}
      onCancel={() => hideSendEmailPopup()}
      footer={null}
      width={640}
    >
      <Form
        layout="horizontal"
        name="EmailForm"
        form={form}
        onFinish={handleFinish}
        scrollToFirstError={true}
        initialValues={formInitialValues}
      >
        <Row gutter={[8, 16]}>
          <Col xs={24}>
            <Form.Item
              {...sendCustomerEmailFormLayout}
              id="recipients"
              name="recipients"
              label={t('RECIPIENTS')}
              rules={validationRules.arrayValidation}
            >
              <Select
                showArrow
                showSearch
                placeholder={t('SELECT_THE_RECIPIENTS')}
                mode="multiple"
                maxTagCount="responsive"
                values={selectedRecipients}
                optionLabelProp="label"
              >
                <Select.OptGroup
                  label={<Text className={styles.optionSeparatorText}> {t('ACTIVE_USER')} </Text>}
                  key="Active User"
                >
                  {validRecipients?.active?.map((recipient) => (
                    <Select.Option value={recipient.external_id} key={recipient.external_id} label={recipient.name}>
                      {recipient.name}
                    </Select.Option>
                  ))}
                  {validRecipients?.active?.length <= 0 && <Text disabled> {t('NO_ACTIVE_USER')} </Text>}
                </Select.OptGroup>
                <Select.OptGroup
                  label={<Text className={styles.optionSeparatorText}> {t('EXPIRED_USER')} </Text>}
                  key="Expired User"
                >
                  {validRecipients?.expired?.map((recipient) => (
                    <Select.Option value={recipient.external_id} key={recipient.external_id} label={recipient.name}>
                      {recipient.name}
                    </Select.Option>
                  ))}
                  {validRecipients?.expired?.length <= 0 && <Text disabled> {t('NO_EXPIRED_USER')} </Text>}
                </Select.OptGroup>
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              {...sendCustomerEmailFormLayout}
              id="subject"
              name="subject"
              label={t('EMAIL_SUBJECT')}
              rules={validationRules.requiredValidation}
            >
              <Input placeholder={t('SUBJECT_OF_THE_EMAIL')} />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              {...sendCustomerEmailBodyFormLayout}
              label={t('EMAIL_BODY')}
              name="emailBody"
              id="emailBody"
              rules={validationRules.requiredValidation}
            >
              <TextEditor name="emailBody" form={form} placeholder={t('CONTENT_OF_THE_EMAIL')} />
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
                    label={t('UPLOAD_A_PDF_FILE')}
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
                    <Tooltip title={t('REMOVE_THIS_FILE')}>
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
            <Button block type="default" onClick={() => hideSendEmailPopup()} loading={submitting}>
              {t('CANCEL')}
            </Button>
          </Col>
          <Col xs={12} md={6}>
            <Button block type="primary" htmlType="submit" loading={submitting}>
              {t('SEND_EMAIL')}
            </Button>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default SendCustomerEmailModal;
