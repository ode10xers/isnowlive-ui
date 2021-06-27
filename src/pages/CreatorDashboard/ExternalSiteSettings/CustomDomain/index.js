import React, { useState, useEffect } from 'react';

import { Row, Col, Button, Typography, Input, Form, Modal } from 'antd';

import apis from 'apis';

import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import validationRules from 'utils/validation';

import { useGlobalContext } from 'services/globalContext';

import styles from './styles.module.scss';
import { getLocalUserDetails } from 'utils/storage';

const { Title, Paragraph, Text } = Typography;

// Source : https://www.regextester.com/103452
//eslint-disable-next-line
const validDomainNameRegexp = new RegExp('(?=^.{4,253}$)(^((?!-)[a-zA-Z0-9-]{0,62}[a-zA-Z0-9].)+[a-zA-Z]{2,63}$)');

const CustomDomain = () => {
  const {
    state: { userDetails },
    setUserDetails,
  } = useGlobalContext();

  const [form] = Form.useForm();

  const [submitting, setSubmitting] = useState(false);

  const generateCustomDomainFromInput = (subdomain, domain) => (subdomain ? `${subdomain}.${domain}` : domain);

  const validateDomainNameFormat = (customDomain) => validDomainNameRegexp.test(customDomain);

  const connectDomain = async (customDomain) => {
    setSubmitting(true);

    try {
      const { status } = await apis.user.updateCustomDomainForCreator({
        domain_url: customDomain,
      });

      if (isAPISuccess(status)) {
        showSuccessModal('Custom Domain Connected');
        const localUserDetails = getLocalUserDetails();
        localUserDetails.profile.custom_domain = customDomain;

        setUserDetails(localUserDetails);
        localStorage.setItem('user-details', JSON.stringify(localUserDetails));
      }
    } catch (error) {
      showErrorModal('Failed connecting custom domain', error?.response?.data?.message || 'Something went wrong.');
    }

    setSubmitting(false);
  };

  const handleFinish = (values) => {
    const customDomain = generateCustomDomainFromInput(values.subdomain || null, values.domain);

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

  useEffect(() => {
    if (userDetails?.profile?.custom_domain) {
      const creatorCustomDomainSegments = userDetails?.profile?.custom_domain.split('.');

      if (creatorCustomDomainSegments.length > 1) {
        const creatorDomain = creatorCustomDomainSegments.pop();

        console.log(creatorCustomDomainSegments);
        console.log(creatorDomain);

        form.setFieldsValue({
          subdomain: creatorCustomDomainSegments.join('.'),
          domain: creatorDomain,
        });
      } else {
        form.setFieldsValue({
          subdomain: '',
          domain: creatorCustomDomainSegments[0],
        });
      }
    }
  }, [userDetails, form]);

  return (
    <div className={styles.box}>
      <Row gutter={[8, 16]}>
        <Col xs={24}>
          <Title level={5}> Custom Domain </Title>
        </Col>
        <Col xs={24}>
          <Paragraph>
            You can run your passion.do site on your own domain. Please add the domain you want below
          </Paragraph>
          <Paragraph>Main Domain - an example main domain is vinyasayoga.com</Paragraph>
          <Paragraph>
            Subdomain = an example subdomain is online.vinyasayoga.com or live.vinyasayoga.com or book.vinyasayoga.com
          </Paragraph>
        </Col>
        <Col xs={24}>
          <Form form={form} scrollToFirstError={true} labelAlign="right" onFinish={handleFinish}>
            <Row gutter={[8, 8]}>
              <Col>
                <Form.Item label="Custom Domain" required>
                  <Form.Item name="subdomain" className={styles.inlineFormItem}>
                    <Input
                      placeholder="Your subdomain here"
                      disabled={submitting || userDetails.profile?.custom_domain}
                    />
                  </Form.Item>
                  <span className={styles.inlineFormSeparator}>.</span>
                  <Form.Item name="domain" className={styles.inlineFormItem} rules={validationRules.requiredValidation}>
                    <Input placeholder="Your domain here" disabled={submitting || userDetails.profile?.custom_domain} />
                  </Form.Item>
                </Form.Item>
              </Col>
              <Col>
                <Form.Item>
                  {userDetails?.profile?.custom_domain ? (
                    <Button className={styles.disabledBuyBtn} type="primary" htmlType="submit" disabled={true}>
                      Domain Configured
                    </Button>
                  ) : (
                    <Button className={styles.greenBtn} type="primary" htmlType="submit" loading={submitting}>
                      Connect Domain
                    </Button>
                  )}
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
