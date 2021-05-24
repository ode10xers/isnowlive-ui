import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';

import { Row, Col, Button, Select, Typography, Popconfirm, Input, Form } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

import apis from 'apis';

import Loader from 'components/Loader';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';
import UnlayerEmailEditor from 'components/UnlayerEmailEditor';

import { isAPISuccess } from 'utils/helper';
import validationRules from 'utils/validation';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const defaultTemplateKey = 'blank';

const EmailTemplates = () => {
  const emailEditor = useRef(null);
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [creatorEmailTemplates, setCreatorEmailTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplateKey);

  const isCreating = useMemo(() => selectedTemplate === defaultTemplateKey, [selectedTemplate]);

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
      showErrorModal(
        'Failed fetching creator email templates',
        error?.response?.data?.message || 'Something went wrong.'
      );
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
    fetchCreatorEmailTemplates();
  }, [fetchCreatorEmailTemplates]);

  useEffect(() => {
    if (!isCreating) {
      fetchEmailTemplateDesign(selectedTemplate);
    }
  }, [selectedTemplate, fetchEmailTemplateDesign, isCreating]);

  const handleChangeSelectedTemplate = (val) => {
    if (val === defaultTemplateKey) {
      if (emailEditor.current) {
        emailEditor.current.resetEditorContent();
      }
    }

    const selectedTemplateData = creatorEmailTemplates.find((template) => template.id === val);
    form.setFieldsValue({ ...form.getFieldsValue(), templateName: selectedTemplateData?.name || null });
    setSelectedTemplate(val);
  };

  const handleDeleteEmailTemplate = async () => {
    setIsLoading(true);

    if (isCreating) {
      showErrorModal('Please select a template to delete!');
      return;
    }

    try {
      const { status } = await apis.newsletter.deleteEmailTemplate(selectedTemplate);

      if (isAPISuccess(status)) {
        showSuccessModal('Email template successfully deleted!');
        await fetchCreatorEmailTemplates();
        setSelectedTemplate(defaultTemplateKey);
        form.setFieldsValue({ ...form.getFieldsValue(), templateName: null });
        if (emailEditor.current) {
          emailEditor.current.resetEditorContent();
        }
      }
    } catch (error) {
      showErrorModal('Failed to delete template', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  const handleFormFinish = (values) => {
    setIsLoading(true);

    if (!emailEditor.current) {
      showErrorModal('Something went wrong');
      console.error('Ref is undefined!');
      return;
    }

    emailEditor.current.editor.exportHtml(async (templateData) => {
      const htmlTemplate = templateData.html.replaceAll('\n', '');
      const jsonTemplate = templateData.design;

      try {
        const payload = {
          name: values.templateName,
          template_json: jsonTemplate,
          template_html: htmlTemplate,
        };

        const { status, data } = isCreating
          ? await apis.newsletter.createEmailTemplate(payload)
          : await apis.newsletter.updateEmailTemplate(selectedTemplate, payload);

        if (isAPISuccess(status) && data) {
          showSuccessModal(`Email template successfully ${isCreating ? 'created' : 'updated'}`);
          await fetchCreatorEmailTemplates();
          setSelectedTemplate(data.id);
          form.setFieldsValue({ ...form.getFieldsValue(), templateName: data?.name });
        }
      } catch (error) {
        showErrorModal(
          `Failed to ${isCreating ? 'create' : 'update'} email template`,
          error?.response?.data?.message || 'Something went wrong.'
        );
      }

      setIsLoading(false);
    });
  };

  const templateOptions = useMemo(() => {
    return [
      {
        label: <Text strong> Create a new template </Text>,
        value: defaultTemplateKey,
      },
      ...creatorEmailTemplates.map((template) => ({
        label: template.name,
        value: template.id,
      })),
    ];
  }, [creatorEmailTemplates]);

  return (
    <Row gutter={[8, 24]} className={styles.box}>
      <Col xs={24}>
        <Title level={5}>Email Templates</Title>
      </Col>
      {/* Dropdown section */}
      <Col xs={24}>
        <Row gutter={[8, 8]}>
          <Col className={styles.templatePickerLabel}>Select a template :</Col>
          <Col>
            <Select
              showArrow
              showSearch
              placeholder="Select an email template"
              onChange={handleChangeSelectedTemplate}
              defaultValue={defaultTemplateKey}
              value={selectedTemplate}
              options={templateOptions}
            />
          </Col>
        </Row>
      </Col>
      {/* CTA Sections */}

      <Col xs={24}>
        <Loader loading={isLoading} size="large">
          <Form form={form} scrollToFirstError={true} onFinish={handleFormFinish}>
            <Row gutter={[8, 8]}>
              <Col xs={24} md={12} lg={10}>
                <Form.Item label="Template Name" name="templateName" rules={validationRules.requiredValidation}>
                  <Input placeholder="Input template name here" maxLength={50} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12} lg={14}>
                <Row gutter={[8, 8]} justify="end">
                  <Col xs={24} md={12} lg={8}>
                    <Form.Item hidden={isCreating}>
                      <Popconfirm
                        arrowPointAtCenter
                        icon={<DeleteOutlined className={styles.danger} />}
                        title="Are you sure you want to delete this email template?"
                        okText="Yes, delete this template"
                        cancelText="No"
                        okButtonProps={{ danger: true, type: 'primary' }}
                        onConfirm={handleDeleteEmailTemplate}
                      >
                        <Button danger block type="primary">
                          {' '}
                          Delete Template{' '}
                        </Button>
                      </Popconfirm>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12} lg={8}>
                    <Button block type="primary" htmlType="submit">
                      {isCreating ? 'Save new' : 'Update this'} template
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>
          </Form>
        </Loader>
      </Col>
      {/* Email Editor Section */}
      <Col xs={24}>
        <UnlayerEmailEditor ref={emailEditor} />
      </Col>
    </Row>
  );
};

export default EmailTemplates;
