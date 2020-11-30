import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import { Form, Typography, Button, Space, Row, Col, Input, Radio, message } from 'antd';
import OnboardSteps from 'components/OnboardSteps';
import Section from 'components/Section';

import { profileFormItemLayout } from 'layouts/FormLayouts';
import validationRules from 'utils/validation';
import { isAPISuccess } from 'utils/helper';
import Routes from 'routes';
import apis from 'apis';

import styles from './style.module.scss';

const { Title } = Typography;

const ZoomAuthType = {
  OAUTH: 'OAUTH',
  JWT: 'JWT',
};

const LiveStream = () => {
  const [form] = Form.useForm();
  const history = useHistory();
  const [selectedZoomOption, setSelectedZoomOption] = useState(ZoomAuthType.OAUTH);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(true);

  useEffect(() => {
    if (history.location.pathname.includes('dashboard')) {
      setIsOnboarding(false);
    }
  }, [history.location.pathname]);

  const storeZoomCrendetials = async (values) => {
    try {
      setIsLoading(true);
      const { status } = await apis.user.storeZoomCredentials(values);
      setIsLoading(false);
      if (isAPISuccess(status)) {
        message.success('Zoom successfully setup!');
        // setTimeout is used for better user experince suggest by Rahul
        setTimeout(() => {
          history.push(Routes.session);
        }, 2000);
      }
    } catch (error) {
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  return (
    <>
      {isOnboarding && <OnboardSteps current={1} />}
      <Space size="middle">
        <Typography>
          <Title>Setup Livestream</Title>
        </Typography>
      </Space>

      <Section>
        <Title level={4}>Setup your Zoom</Title>

        <Row className={styles.zoomOption}>
          <label className={styles.accountSelectionLabel}>Ways to setup:</label>
          <Radio.Group onChange={(e) => setSelectedZoomOption(e.target.value)} value={selectedZoomOption}>
            <Radio value={ZoomAuthType.OAUTH}>Connect your Zoom account</Radio>
            <Radio value={ZoomAuthType.JWT}>Add your Zoom details</Radio>
          </Radio.Group>
        </Row>

        {selectedZoomOption === ZoomAuthType.OAUTH && (
          <Row align="center" className={styles.zoomConnectAccount}>
            <p className={styles.textAlignCenter}>
              We will connect your Zoom Account. You will be taken to Zoom authorization page. You'll be taken back to
              this page.
            </p>
            <Button type="primary" className={styles.mt30}>
              Connect my Zoom Account
            </Button>
          </Row>
        )}
        {selectedZoomOption === ZoomAuthType.JWT && (
          <Row className={styles.zoomConnectAccountForm}>
            <Col span={24}>
              <p>
                Want a tour of this page? <a href>Watch the video</a>
              </p>
              <p>
                Our Zoom integration will automatically create unique Zoom Meetings for each event that you create in
                your dashboard. This means that you never have to keep track of Zoom links again. Unique Zoom meetings
                will also be created for each recurring event.
              </p>
              <p>Note: Your account needs to be under a paid plan.</p>
            </Col>
            <Col span={24}>
              <Title level={3}>Setting up the integration</Title>
              <p>
                We'll need three things. Your <strong>API Key,</strong> <strong>API Secret,</strong> and{' '}
                <strong>email</strong> that is associated with your Zoom account.
              </p>
              <ol>
                <li>
                  Go to <a href>https://marketplace.zoom.us</a> and Sign In.
                </li>
                <li>Top right, select Develop and then Build App.</li>
                <li>Click Create under JWT app type.</li>
                <li>Name the app "Passion".</li>
                <li>Fill in all the required information and make sure the app is activated.</li>
                <li>
                  Collect your <strong>API Key</strong> and your <strong>API Secret,</strong> and the{' '}
                  <strong>email</strong> of your Zoom account. Paste these below.
                </li>
              </ol>
              <p>
                <strong>Note:</strong>In your Zoom account (at <a href>zoom.us</a>), please go to settings and ensure
                that{' '}
                <em>
                  Use Personal Meeting ID (PMI) when scheduling a meeting is turned <strong>off</strong>
                </em>
                .
              </p>
            </Col>
            <Col span={24}>
              <Form form={form} {...profileFormItemLayout} onFinish={storeZoomCrendetials}>
                <Col span={24}>
                  <Form.Item label="API Key" name="api_key" rules={validationRules.requiredValidation}>
                    <Input placeholder="API Key" />
                  </Form.Item>
                  <Form.Item label="API Secret" name="api_secret" rules={validationRules.requiredValidation}>
                    <Input placeholder="API Secret" />
                  </Form.Item>
                  <Form.Item label="Email" name="email" rules={validationRules.emailValidation}>
                    <Input placeholder="Email" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Row justify="center">
                    <Col>
                      <Form.Item>
                        <Button htmlType="submit" type="primary" loading={isLoading}>
                          Submit
                        </Button>
                      </Form.Item>
                    </Col>
                  </Row>
                </Col>
              </Form>
            </Col>
          </Row>
        )}
      </Section>
    </>
  );
};

export default LiveStream;
