import React, { useState } from 'react';

import { Row, Col, Button, Typography, Input, Form, Modal } from 'antd';

import apis from 'apis';

import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';
import validationRules from 'utils/validation';

const { Title, Paragraph, Text } = Typography;

// Source : https://www.regextester.com/103452
//eslint-disable-next-line
const validDomainNameRegexp = new RegExp('(?=^.{4,253}$)(^((?!-)[a-zA-Z0-9-]{0,62}[a-zA-Z0-9].)+[a-zA-Z]{2,63}$)');

const CustomDomain = () => {
  const [form] = Form.useForm();

  const [submitting, setSubmitting] = useState(false);

  const generateCustomDomainFromInput = (subdomain, domain) => (subdomain ? `${subdomain}.${domain}` : domain);

  const validateDomainNameFormat = (customDomain) => validDomainNameRegexp.test(customDomain);

  const connectDomain = async (customDomain) => {
    setSubmitting(true);

    try {
      //TODO: Implement API Here
      const { status } = await apis.user.updateCustomDomainForCreator({
        domain_url: customDomain,
      });

      if (isAPISuccess(status)) {
        showSuccessModal('Custom Domain Connected');
      }
    } catch (error) {
      showErrorModal('Failed connecting custom domain', error?.response?.data?.message || 'Something went wrong.');
    }

    setSubmitting(false);
  };

  const handleFinish = (values) => {
    const customDomain = generateCustomDomainFromInput(values.subdomain || null, values.domain);
    console.log(customDomain);

    if (validateDomainNameFormat(customDomain)) {
      Modal.confirm({
        closable: false,
        maskClosable: false,
        centered: true,
        title: 'Moving your site to your custom domain',
        content: (
          <>
            <Paragraph>
              Your passion.do site will now be accessible on <Text strong> {customDomain} </Text>
            </Paragraph>
            <Paragraph>Please confirm the change</Paragraph>
          </>
        ),
        okText: 'Confirm',
        cancel: 'Make changes',
        onOk: () => connectDomain(customDomain),
      });
    } else {
      showErrorModal(
        'Custom Domain Invalid',
        <>
          <Paragraph>It seems the domain name you inputted ({customDomain}) is invalid, please check again</Paragraph>
        </>
      );
    }
  };

  return (
    <div className={styles.box}>
      <Row gutter={[8, 16]}>
        <Col xs={24}>
          <Title level={5}> Custom Domain </Title>
        </Col>
        <Col xs={24}>
          <Paragraph>Some help text we can provide here</Paragraph>
        </Col>
        <Col xs={24}>
          <Form form={form} scrollToFirstError={true} labelAlign="right" onFinish={handleFinish}>
            <Row gutter={[8, 8]}>
              <Col>
                <Form.Item label="Custom Domain" required>
                  <Form.Item name="subdomain" className={styles.inlineFormItem}>
                    <Input placeholder="Your subdomain here" disabled={submitting} />
                  </Form.Item>
                  <span className={styles.inlineFormSeparator}>.</span>
                  <Form.Item name="domain" className={styles.inlineFormItem} rules={validationRules.requiredValidation}>
                    <Input placeholder="Your domain here" disabled={submitting} />
                  </Form.Item>
                </Form.Item>
              </Col>
              <Col>
                <Form.Item>
                  <Button type="primary" htmlType="submit" loading={submitting}>
                    Connect Domain
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>
    </div>
  );
};

export default CustomDomain;
