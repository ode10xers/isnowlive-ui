import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import { Row, Col, Form, Modal, Tooltip, Input, Select, Typography, Button } from 'antd';
import { FilePdfOutlined, CloseCircleOutlined } from '@ant-design/icons';

import apis from 'apis';

import Loader from 'components/Loader';
import FileUpload from 'components/FileUpload';
import UnlayerEmailEditor from 'components/UnlayerEmailEditor';
// import TextEditor from 'components/TextEditor';
import { resetBodyStyle, showErrorModal, showSuccessModal } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { isAPISuccess } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';

import { sendCustomerEmailFormLayout } from 'layouts/FormLayouts';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const defaultTemplateKey = 'blank';
const formInitialValues = {
  recipients: [],
  subject: '',
  emailTemplate: defaultTemplateKey,
};

const SendCustomerEmailModal = () => {
  const emailEditor = useRef(null);

  const {
    state: { emailPopupVisible, emailPopupData },
    hideSendEmailPopup,
  } = useGlobalContext();

  const { recipients, productId, productType } = emailPopupData;

  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [validRecipients, setValidRecipients] = useState({
    active: [],
    expired: [],
  });
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [emailDocumentUrl, setEmailDocumentUrl] = useState(null);
  const [creatorEmailTemplates, setCreatorEmailTemplates] = useState([]);

  const loadDesignInEditor = (data) => {
    if (emailEditor.current) {
      emailEditor.current.loadDesign(data.template_json);
    } else {
      // Naive approach, give delay and check again
      const loadDesignInterval = setInterval(() => {
        if (emailEditor.current) {
          emailEditor.current.loadDesign(data.template_json);
          clearInterval(loadDesignInterval);
        }
      }, 1000);
    }
  };

  const fetchCreatorEmailTemplates = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.newsletter.getCreatorEmailTemplates();

      if (isAPISuccess(status) && data) {
        setCreatorEmailTemplates(data.templates);
      }
    } catch (error) {
      console.error(error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  }, []);

  const fetchEmailTemplateDesign = useCallback(async (templateId) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.newsletter.getEmailTemplateDetails(templateId);

      if (isAPISuccess(status) && data) {
        loadDesignInEditor(data);
      }
    } catch (error) {
      showErrorModal(
        'Failed fetching creator email templates',
        error?.response?.data?.message || 'Something went wrong.'
      );
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!emailPopupVisible || (recipients?.active?.length < 1 && recipients?.expired?.length < 1)) {
      setIsLoading(false);
      setValidRecipients({
        active: [],
        expired: [],
      });
      setSelectedRecipients([]);
      setEmailDocumentUrl(null);

      form.resetFields();
      if (emailEditor.current) {
        emailEditor.current.resetEditorContent();
      }
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

  useEffect(() => {
    if (emailPopupVisible) {
      fetchCreatorEmailTemplates();
    }
  }, [fetchCreatorEmailTemplates, emailPopupVisible]);

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  const handleFinish = async (values) => {
    if (emailEditor.current) {
      emailEditor.current.editor.exportHtml(async (data) => {
        const emailBody = data.html.replaceAll(`\n`, '');
        setIsLoading(true);

        try {
          const payload = {
            product_id: productId,
            product_type: productType.toUpperCase(),
            body: emailBody,
            subject: values.subject,
            user_ids: selectedRecipients || values.recipients,
            document_url: emailDocumentUrl || '',
          };

          const { status } = await apis.user.sendProductEmailToCustomers(payload);

          if (isAPISuccess(status)) {
            showSuccessModal('Emails sent');
            hideSendEmailPopup();
          }
        } catch (error) {
          showErrorModal('Failed to send emails', error?.response?.data?.message || 'Something went wrong');
        }

        setIsLoading(false);
      });
    }
  };

  const handleChangeSelectedTemplate = (val) => {
    if (val === defaultTemplateKey) {
      if (emailEditor.current) {
        emailEditor.current.resetEditorContent();
      }
    } else {
      fetchEmailTemplateDesign(val);
    }
  };

  const templateOptions = useMemo(() => {
    return [
      {
        label: <Text strong> Don't use template </Text>,
        value: defaultTemplateKey,
      },
      ...creatorEmailTemplates.map((template) => ({
        label: template.name,
        value: template.id,
      })),
    ];
  }, [creatorEmailTemplates]);

  return (
    <Modal
      title={<Title level={5}> Send email to customers </Title>}
      visible={emailPopupVisible}
      centered={true}
      onCancel={hideSendEmailPopup}
      footer={null}
      width={1080}
      afterClose={resetBodyStyle}
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
          <Loader loading={isLoading} size="large">
            <Col xs={24}>
              <Form.Item {...sendCustomerEmailFormLayout} label="Replies will be sent to">
                <Text strong> {getLocalUserDetails()?.email} </Text>
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
                  optionLabelProp="label"
                >
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Active User </Text>}
                    key="Active User"
                  >
                    {validRecipients?.active?.map((recipient) => (
                      <Select.Option value={recipient.external_id} key={recipient.external_id} label={recipient.name}>
                        {recipient.name}
                      </Select.Option>
                    ))}
                    {validRecipients?.active?.length <= 0 && (
                      <Select.Option disabled value="no_active_user">
                        {' '}
                        <Text disabled> No active user </Text>{' '}
                      </Select.Option>
                    )}
                  </Select.OptGroup>
                  <Select.OptGroup
                    label={<Text className={styles.optionSeparatorText}> Expired User </Text>}
                    key="Expired User"
                  >
                    {validRecipients?.expired?.map((recipient) => (
                      <Select.Option value={recipient.external_id} key={recipient.external_id} label={recipient.name}>
                        {recipient.name}
                      </Select.Option>
                    ))}
                    {validRecipients?.expired?.length <= 0 && (
                      <Select.Option disabled value="no_expired_user">
                        {' '}
                        <Text disabled> No expired user </Text>{' '}
                      </Select.Option>
                    )}
                  </Select.OptGroup>
                </Select>
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
                {...sendCustomerEmailFormLayout}
                id="emailTemplate"
                name="emailTemplate"
                label="Email template"
              >
                <Select
                  showArrow
                  showSearch
                  placeholder="Select the template to use"
                  onChange={handleChangeSelectedTemplate}
                  options={templateOptions}
                />
              </Form.Item>
            </Col>
          </Loader>
          <Col xs={24}>
            <UnlayerEmailEditor ref={emailEditor} />
          </Col>
          {/* <Col xs={24}>
            <Form.Item
              {...sendCustomerEmailBodyFormLayout}
              label="Email Body"
              name="emailBody"
              id="emailBody"
              rules={validationRules.requiredValidation}
            >
              <TextEditor name="emailBody" form={form} placeholder="Content of the email goes here" />
            </Form.Item>
          </Col> */}
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
            <Button block type="default" onClick={hideSendEmailPopup} loading={isLoading}>
              Cancel
            </Button>
          </Col>
          <Col xs={12} md={6}>
            <Button block type="primary" htmlType="submit" loading={isLoading}>
              Send Email
            </Button>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default SendCustomerEmailModal;
