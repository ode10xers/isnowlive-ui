import React, { useState, useEffect, useCallback, useMemo } from 'react';
import classNames from 'classnames';

import { Row, Col, Tabs, Typography, Button, Form } from 'antd';

import apis from 'apis';

import Loader from 'components/Loader';
import TextEditor from 'components/TextEditor';
import { showErrorModal, showSuccessModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';
import { generateDefaultText } from 'utils/legals';
import { getLocalUserDetails } from 'utils/storage';

import styles from './styles.module.scss';

const { TabPane } = Tabs;
const { Title, Text } = Typography;

const tabData = [
  {
    key: 'waiver',
    name: 'Waiver Policy',
    title: <Text strong> Waiver </Text>,
  },
  {
    key: 'terms',
    name: 'Terms and Conditions',
    title: <Text strong> Terms and Conditions </Text>,
  },
  {
    key: 'refund_policy',
    name: 'Refund Policy',
    title: <Text strong> Refund Policy </Text>,
  },
];

const Legals = () => {
  const [form] = Form.useForm();

  const creatorName = getLocalUserDetails()
    ? `${getLocalUserDetails().first_name} ${getLocalUserDetails()?.last_name}`
    : 'Creator';
  const defaultLegalData = useMemo(() => generateDefaultText(creatorName), [creatorName]);

  const [isLoading, setIsLoading] = useState(false);
  const [legalData, setLegalData] = useState();
  const [selectedTab, setSelectedTab] = useState('waiver');
  // This state is for determining whether to hit create/update API
  const [isNewLegal, setIsNewLegal] = useState(false);

  const fetchLegalData = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.legals.getCreatorLegals();

      if (isAPISuccess(status) && data) {
        const legalResponseData = {
          waiver: data.waiver,
          refund_policy: data.refund_policy,
          terms: data.terms,
        };

        setLegalData(legalResponseData);
        form.setFieldsValue(legalResponseData);
      }
    } catch (error) {
      if (error?.response?.status === 500 && error?.response?.data?.message === 'no legal documents found for user') {
        // If no legal docs found for user, set legal data as null
        // Also pass silently
        form.resetFields();
        setLegalData(defaultLegalData);
        setIsNewLegal(true);
      } else {
        showErrorModal(
          'Failed to fetch terms and conditions data',
          error?.response?.data?.message || 'Something went wrong.'
        );
      }
    }

    setIsLoading(false);
  }, [form, defaultLegalData]);

  useEffect(() => {
    fetchLegalData();
  }, [fetchLegalData]);

  const publishLegalData = async (legalDataKey, legalDataName) => {
    setIsLoading(true);

    console.log(form.getFieldValue(legalDataKey));

    const payload = {
      ...legalData,
      [legalDataKey]: form.getFieldValue(legalDataKey),
    };

    try {
      const { status, data } = isNewLegal
        ? await apis.legals.createLegals(payload)
        : await apis.legals.updateLegals(payload);

      if (isAPISuccess(status) && data) {
        setLegalData({
          waiver: data.waiver,
          terms: data.terms,
          refund_policy: data.refund_policy,
        });
        setIsNewLegal(false);
        showSuccessModal(`Successfully updated ${legalDataName}`);
      }
    } catch (error) {
      showErrorModal('Failed updating legal data', error?.response?.data?.message || 'Something went wrong.');
    }

    setIsLoading(false);
  };

  return (
    <div className={classNames(styles.box, styles.mt20)}>
      <Row gutter={[8, 16]}>
        <Col xs={24}>
          <Title level={4}> Waiver and Policies </Title>
        </Col>
        <Col xs={24}>
          <Loader loading={isLoading} text="Loading legal data...">
            <Form form={form} initialValues={defaultLegalData}>
              <Tabs size="large" activeKey={selectedTab} onChange={setSelectedTab}>
                {tabData.map((tab) => (
                  <TabPane key={tab.key} tab={tab.title} className={styles.legalTab}>
                    <Row gutter={[8, 16]} justify="start">
                      <Col xs={24} className={styles.legalTextEditor}>
                        <Form.Item name={tab.key} id={tab.key}>
                          <TextEditor name={tab.key} form={form} placeholder={`Put in your ${tab.name} here`} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={8} lg={6}>
                        <Button block type="primary" onClick={() => publishLegalData(tab.key, tab.name)}>
                          Save and Publish
                        </Button>
                      </Col>
                    </Row>
                  </TabPane>
                ))}
              </Tabs>
            </Form>
          </Loader>
        </Col>
      </Row>
    </div>
  );
};

export default Legals;
