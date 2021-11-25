import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { generatePath } from 'react-router-dom';
import classNames from 'classnames';

import debounce from 'lodash.debounce';

import { Row, Col, Typography, Button, Input, Form, Spin, PageHeader, Card, Image, message } from 'antd';

import apis from 'apis';
import Routes from 'routes';

import { showErrorModal } from 'components/Modals/modals';

import { pageCreateFormLayout, pageCreateFormTailLayout } from 'layouts/FormLayouts';

import validationRules from 'utils/validation';
import { isAPISuccess } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import { pageTypes, websiteComponentTypes } from 'utils/constants';
import { createValidSlug, generateUrlFromUsername } from 'utils/url';
import { blankPageTemplate, headerTemplate, footerTemplate } from 'utils/pageEditorTemplates';

import styles from './styles.module.scss';

import DefaultImage from 'assets/images/greybg.jpg';

const { Title, Text } = Typography;

const TemplatePreviewItem = ({ template = null, handleItemClicked = () => {} }) => (
  <Card
    hoverable
    onClick={() => handleItemClicked(template)}
    cover={<Image loading="lazy" src={template.thumbnail_url} fallback={DefaultImage} />}
  >
    <Card.Meta title={template.name} description={template.description} />
  </Card>
);

const CustomPageForm = ({ match, location, history }) => {
  const targetPageId = match.params.page_id ?? null;
  const isCreatingHomepage = location.state?.isHome ?? false;

  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(true);
  const [pageDetails, setPageDetails] = useState(null);

  const [isValidSlug, setIsValidSlug] = useState(true);
  const [isValidatingSlug, setIsValidatingSlug] = useState(false);

  const [shouldCreateHeader, setShouldCreateHeader] = useState(false);
  const [shouldCreateFooter, setShouldCreateFooter] = useState(false);

  // NOTE: We need to make sure at least there's a default template selected
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const fetchCreatorHeaderComponent = useCallback(async () => {
    try {
      const { status, data } = await apis.custom_pages.getWebsiteComponent(websiteComponentTypes.HEADER);

      if (isAPISuccess(status) && data) {
        setShouldCreateHeader(false);
      }
    } catch (error) {
      console.log('Failed fetching creator header component!');
      console.error(error);

      if (error?.response?.status === 500 && error?.response?.data?.message === 'component doesnt exist') {
        setShouldCreateHeader(true);
      }
    }
  }, []);

  const fetchCreatorFooterComponent = useCallback(async () => {
    try {
      const { status, data } = await apis.custom_pages.getWebsiteComponent(websiteComponentTypes.FOOTER);

      if (isAPISuccess(status) && data) {
        setShouldCreateFooter(false);
      }
    } catch (error) {
      console.log('Failed fetching creator footer component!');
      console.error(error);
      if (error?.response?.status === 500 && error?.response?.data?.message === 'component doesnt exist') {
        setShouldCreateFooter(true);
      }
    }
  }, []);

  const fetchPageDetails = useCallback(async (pageId) => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.custom_pages.getPageById(pageId);

      if (isAPISuccess(status) && data) {
        setPageDetails(data);
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to fetch page details!', error?.response?.data?.message ?? 'Something went wrong.');
    }

    setIsLoading(false);
  }, []);

  const fetchPageTemplates = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.custom_pages.getPageTemplates();

      if (isAPISuccess(status) && data) {
        setTemplates(data);
        setSelectedTemplate(data[0] ?? null);
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to fetch page templates!', error?.response?.data?.message ?? 'Something went wrong.');
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isCreatingHomepage) {
      fetchCreatorHeaderComponent();
      fetchCreatorFooterComponent();
    }
  }, [isCreatingHomepage, fetchCreatorHeaderComponent, fetchCreatorFooterComponent]);

  useEffect(() => {
    if (targetPageId) {
      fetchPageDetails(targetPageId);
    } else {
      setIsLoading(false);
    }

    fetchPageTemplates();
  }, [targetPageId, fetchPageDetails, fetchPageTemplates]);

  useEffect(() => {
    if (pageDetails) {
      form.setFieldsValue({
        customPageName: pageDetails?.name ?? '',
        customPageSlug: pageDetails?.slug ?? '',
      });
    } else {
      form.resetFields();
    }
  }, [pageDetails, form]);

  const checkValidPageSlug = useCallback(
    async (e) => {
      setIsValidatingSlug(true);
      try {
        const pageSlug = form.getFieldsValue()['customPageSlug'];

        if (!pageSlug) {
          setIsValidSlug(false);
          setIsValidatingSlug(false);
          return;
        }

        const { status, data } = await apis.custom_pages.checkPageSlug(pageSlug);

        if (isAPISuccess(status)) {
          setIsValidSlug(data);
        }
      } catch (error) {
        console.error(error);
        message.error(error?.response?.data?.message ?? 'Failed validating slug');
      }
      setIsValidatingSlug(false);
    },
    [form]
  );

  const onSlugChangeCallback = useMemo(() => debounce(checkValidPageSlug, 350), [checkValidPageSlug]);

  const handleCreateInitialSlug = useCallback(
    async (e) => {
      const pageName = form.getFieldsValue()['customPageName'];
      const pageSlug = createValidSlug(pageName);

      form.setFields([
        {
          name: 'customPageSlug',
          value: pageSlug,
        },
      ]);

      await checkValidPageSlug(e);
    },
    [form, checkValidPageSlug]
  );

  const onNameChangeCallback = useMemo(() => debounce(handleCreateInitialSlug, 250), [handleCreateInitialSlug]);

  const handleFormFinish = async (values, shouldRedirect = true) => {
    setIsLoading(true);

    if (!isValidSlug) {
      message.error('Please enter a valid slug!');
      return;
    }

    try {
      const payload = {
        name: values.customPageName,
        slug: values.customPageSlug ?? '',
        type: isCreatingHomepage ? pageTypes.HOME : pageDetails?.type ?? pageTypes.GENERIC,
        content: pageDetails ? pageDetails.content : selectedTemplate?.content ?? blankPageTemplate.content,
      };

      const { status, data } = targetPageId
        ? await apis.custom_pages.updatePage({ ...payload, external_id: targetPageId })
        : await apis.custom_pages.createPage(payload);

      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        message.success(`Page successfully ${targetPageId ? 'updated' : 'created'}!`);

        const additionalPromises = [];

        if (shouldCreateHeader) {
          const createHeaderPromise = apis.custom_pages.createWebsiteComponent({
            content: headerTemplate,
            component_type: websiteComponentTypes.HEADER,
          });
          additionalPromises.push(createHeaderPromise);
        }

        if (shouldCreateFooter) {
          const createFooterPromise = apis.custom_pages.createWebsiteComponent({
            content: footerTemplate,
            component_type: websiteComponentTypes.FOOTER,
          });
          additionalPromises.push(createFooterPromise);
        }

        if (additionalPromises.length > 0) {
          try {
            await Promise.allSettled(additionalPromises);
          } catch (error) {
            console.error('Error while initializing website components');
            console.error('error');
          }
        }

        if (shouldRedirect) {
          history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.customPages.list);
        } else {
          return targetPageId ?? data?.external_id;
        }
      }
    } catch (error) {
      setIsLoading(false);
      console.error(error);
      showErrorModal(
        `Failed to ${targetPageId ? 'update' : 'create new'} page`,
        error?.response?.data?.message ?? 'Something went wrong.'
      );
    }
    return null;
  };

  const handleSaveAndEditContent = async () => {
    try {
      await form.validateFields();

      const pageId = await handleFormFinish(form.getFieldsValue(), false);

      if (pageId) {
        history.push(generatePath(Routes.creatorDashboard.customPages.simpleEditor, { page_id: pageId }));
      }
    } catch (error) {
      form.scrollToField(error.errorFields[0].name);
      message.error('Please fill all required fields!');
      console.error(error);
    }
  };

  return (
    <div>
      <Spin spinning={isLoading} tip="Processing...">
        <Form layout="horizontal" name="pageForm" form={form} onFinish={handleFormFinish} scrollToFirstError={true}>
          <Row gutter={[8, 24]}>
            {/* Section Header */}
            <Col xs={24}>
              <PageHeader
                title={targetPageId ? 'Edit Page Details' : 'Create New Page'}
                onBack={() => history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.customPages.list)}
              />
            </Col>

            {/* Page Details */}
            <Col xs={24}>
              <Row gutter={[8, 10]}>
                <Col xs={24}>
                  <Title level={4}>Basic Page Info</Title>
                </Col>

                {/* Page Name */}
                <Col xs={24}>
                  <Form.Item
                    {...pageCreateFormLayout}
                    id="customPageName"
                    name="customPageName"
                    label="Page Name"
                    rules={validationRules.requiredValidation}
                  >
                    <Input
                      onChange={(e) => {
                        if (targetPageId || isCreatingHomepage || pageDetails?.type === pageTypes.HOME) {
                          return;
                        } else {
                          onNameChangeCallback(e);
                        }
                      }}
                      placeholder="Your page name"
                      maxLength={180}
                    />
                  </Form.Item>
                </Col>
                {/* Page Slug */}
                <Col xs={24}>
                  <Form.Item
                    {...pageCreateFormLayout}
                    label="Page Link"
                    id="customPageSlug"
                    name="customPageSlug"
                    normalize={(value) => value?.toLowerCase().replace(/[^a-z0-9/-]/gi, '')}
                    rules={
                      isCreatingHomepage || pageDetails?.type === pageTypes.HOME
                        ? []
                        : validationRules.urlSlugValidation
                    }
                    extra={
                      isCreatingHomepage || pageDetails?.type === pageTypes.HOME ? (
                        <Text type="secondary">
                          Your homepage will be accessible at {generateUrlFromUsername(getLocalUserDetails().username)}
                        </Text>
                      ) : null
                    }
                  >
                    <Input
                      onChange={onSlugChangeCallback}
                      disabled={isCreatingHomepage || pageDetails?.type === pageTypes.HOME}
                      addonBefore="/"
                      placeholder="The page link"
                      maxLength={180}
                    />
                  </Form.Item>
                  {isCreatingHomepage || pageDetails?.type === pageTypes.HOME ? null : (
                    <Form.Item {...pageCreateFormTailLayout}>
                      <Row gutter={[8, 8]} className={styles.alignUrl}>
                        {isValidatingSlug ? (
                          <Spin />
                        ) : (
                          <Text type={isValidSlug ? 'success' : 'danger'}>
                            <span className={classNames(styles.dot, isValidSlug ? styles.success : styles.danger)} />
                            {isValidSlug ? 'Link Available' : 'Invalid link'}
                          </Text>
                        )}
                      </Row>
                    </Form.Item>
                  )}
                </Col>
              </Row>
            </Col>

            {/* Template Picker */}
            {!targetPageId && (
              <Col xs={24}>
                <Title level={4}>Page Templates</Title>

                <Row gutter={[8, 8]} className={styles.horizontalScrollableListContainer}>
                  {templates.length > 0
                    ? templates.map((template) => (
                        <Col
                          xs={20}
                          sm={15}
                          md={10}
                          lg={9}
                          xl={7}
                          key={template.external_id}
                          className={
                            selectedTemplate?.external_id === template.external_id ? styles.selectedTemplate : undefined
                          }
                        >
                          <TemplatePreviewItem template={template} handleItemClicked={setSelectedTemplate} />
                        </Col>
                      ))
                    : [blankPageTemplate].map((template) => (
                        <Col
                          xs={20}
                          sm={15}
                          md={10}
                          lg={9}
                          xl={7}
                          key={template.external_id}
                          className={
                            selectedTemplate?.external_id === template.external_id ? styles.selectedTemplate : undefined
                          }
                        >
                          <TemplatePreviewItem template={template} handleItemClicked={setSelectedTemplate} />
                        </Col>
                      ))}
                </Row>
              </Col>
            )}

            <Col xs={24}>
              <Row justify="end" gutter={[10, 10]}>
                <Col>
                  <Button size="large" htmlType="submit" disabled={!isValidSlug}>
                    {targetPageId ? 'Update' : 'Create'} Page
                  </Button>
                </Col>
                <Col>
                  <Button size="large" type="primary" onClick={handleSaveAndEditContent} disabled={!isValidSlug}>
                    Save Changes and Edit Content
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Form>
      </Spin>
    </div>
  );
};

export default CustomPageForm;
