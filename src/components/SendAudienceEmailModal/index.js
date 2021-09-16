import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

import { Row, Col, Modal, Form, Input, Tooltip, Button, Select, Typography } from 'antd';
import { FilePdfOutlined, CloseCircleOutlined } from '@ant-design/icons';

import apis from 'apis';

import Loader from 'components/Loader';
import FileUpload from 'components/FileUpload';
import UnlayerEmailEditor from 'components/UnlayerEmailEditor';
import { resetBodyStyle, showSuccessModal, showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import validationRules from 'utils/validation';
import { getLocalUserDetails } from 'utils/storage';

import { sendCustomerEmailFormLayout } from 'layouts/FormLayouts';

import styles from './styles.module.scss';

const { Title, Text } = Typography;
const defaultTemplateKey = 'blank';
const formInitialValues = {
  recipients: [],
  selectedEmailList: null,
  subject: '',
  emailTemplate: defaultTemplateKey,
};

// The functionality is very similar to SendCustomerEmailModal
// But the data is handled differently since Audience is a different entity
// Also SendCustomerEmail requires some product information while this one does not
const SendAudienceEmailModal = ({ visible, closeModal, recipients = [], targetEmailList = null }) => {
  const emailEditor = useRef(null);
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [validRecipients, setValidRecipients] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [emailDocumentUrl, setEmailDocumentUrl] = useState(null);
  const [creatorEmailTemplates, setCreatorEmailTemplates] = useState([]);
  const [selectedEmailList, setSelectedEmailList] = useState(null);
  const [creatorEmailLists, setCreatorEmailLists] = useState([]);

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

  const fetchCreatorEmailLists = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.newsletter.getCreatorEmailList();

      if (isAPISuccess(status) && data) {
        setCreatorEmailLists(data.mailing_lists);
      }
    } catch (error) {
      showErrorModal('Failed fetching creator email list', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  }, []);

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
    if (visible) {
      if (targetEmailList) {
        fetchCreatorEmailLists();
        setValidRecipients([]);
        setSelectedRecipients([]);
        setSelectedEmailList(targetEmailList);
        form.setFieldsValue({
          recipients: [],
          selectedEmailList: targetEmailList,
        });
      } else if (recipients.length > 0) {
        setValidRecipients(recipients);
        setSelectedRecipients(recipients.map((recipient) => recipient.id));
        setSelectedEmailList(null);
        form.setFieldsValue({
          recipients: recipients.map((recipient) => recipient.id),
          selectedEmailList: null,
        });
      }
    } else {
      form.resetFields();
      setEmailDocumentUrl(null);
      setSelectedRecipients([]);
      setValidRecipients([]);
      setIsLoading(false);
      if (emailEditor.current) {
        emailEditor.current.resetEditorContent();
      }
    }
    fetchCreatorEmailTemplates();
  }, [visible, form, recipients, targetEmailList, fetchCreatorEmailTemplates, fetchCreatorEmailLists]);

  const normFile = (e) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  const handleFinish = (values) => {
    if (emailEditor.current) {
      emailEditor.current.editor.exportHtml(async (data) => {
        const emailBody = data.html.replaceAll(`\n`, '');
        setIsLoading(true);
        try {
          let payload = {
            body: emailBody,
            subject: values.subject,
            document_url: emailDocumentUrl || '',
          };

          if (!selectedEmailList) {
            payload = {
              ...payload,
              audience_ids: selectedRecipients || values.recipients,
            };
          }

          const { status } = selectedEmailList
            ? await apis.newsletter.sendEmailToEmailList(selectedEmailList, payload)
            : await apis.audiences.sendEmailToAudiences(payload);

          if (isAPISuccess(status)) {
            showSuccessModal('Emails sent successfully');
            emailEditor.current.resetEditorContent();
            closeModal();
          }
        } catch (error) {
          showErrorModal('Failed to send emails', error?.respoonse?.data?.message || 'Something went wrong');
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
      title={<Title level={5}> Send email to audiences </Title>}
      visible={visible}
      centered={true}
      onCancel={closeModal}
      footer={null}
      width={1080}
      afterClose={resetBodyStyle}
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
          <Loader loading={isLoading} size="large">
            <Col xs={24}>
              <Form.Item {...sendCustomerEmailFormLayout} label="Replies will be sent to">
                <Text strong> {getLocalUserDetails()?.email} </Text>
              </Form.Item>
            </Col>
            <Col xs={24} hidden={!targetEmailList}>
              <Form.Item
                {...sendCustomerEmailFormLayout}
                id="selectedEmailList"
                name="selectedEmailList"
                label="Email list to send to"
                rules={targetEmailList ? validationRules.requiredValidation : []}
                hidden={!targetEmailList}
              >
                <Select
                  showArrow
                  showSearch
                  placeholder="Select email list to send this email to"
                  values={selectedEmailList}
                  onChange={(val) => setSelectedRecipients(val)}
                  options={creatorEmailLists.map((emailList) => ({
                    label: emailList.name,
                    value: emailList.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} hidden={targetEmailList}>
              <Form.Item
                {...sendCustomerEmailFormLayout}
                id="recipients"
                name="recipients"
                label="Recipients"
                rules={targetEmailList ? [] : validationRules.arrayValidation}
                hidden={targetEmailList}
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
                      {emailDocumentUrl.split('_').splice(1).join('_')}
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
            <Button block type="default" onClick={() => closeModal()} loading={isLoading}>
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

export default SendAudienceEmailModal;
