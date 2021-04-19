import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Form, Typography, Button, Space, Row, Col, Input, Modal, message } from 'antd';
import { VideoCameraOutlined } from '@ant-design/icons';

import OnboardSteps from 'components/OnboardSteps';
import Section from 'components/Section';
import { useGlobalContext } from 'services/globalContext';
import {
  mixPanelEventTags,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';
import { profileFormItemLayout } from 'layouts/FormLayouts';
import validationRules from 'utils/validation';
import { isAPISuccess, ZoomAuthType } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import Routes from 'routes';
import apis from 'apis';
import config from 'config';

import styles from './style.module.scss';
import parseQueryString from 'utils/parseQueryString';
import { gtmTriggerEvents, pushToDataLayer } from 'services/integrations/googleTagManager';

const { Title, Link } = Typography;
const { creator } = mixPanelEventTags;

const LiveStream = () => {
  const [form] = Form.useForm();
  const history = useHistory();
  const location = useLocation();
  const [selectedZoomOption, setSelectedZoomOption] = useState(ZoomAuthType.OAUTH);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const {
    state: {
      userDetails: { zoom_connected = 'NOT_CONNECTED' },
    },
    setUserDetails,
  } = useGlobalContext();
  const { code } = parseQueryString(location.search);

  const getZoomJWTDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const { status, data } = await apis.user.getZoomCredentials();
      if (isAPISuccess(status)) {
        setIsLoading(false);
        form.setFieldsValue(data);
      }
    } catch (error) {
      console.log(error);
      setIsLoading(false);
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  }, [form]);

  const verifyZoomProfile = useCallback(
    async (code) => {
      setIsLoading(true);
      try {
        const { status } = await apis.user.authZoom(code);
        if (isAPISuccess(status)) {
          const localUserDetails = getLocalUserDetails();
          localUserDetails.zoom_connected = ZoomAuthType.OAUTH;
          setUserDetails(localUserDetails);

          pushToDataLayer(gtmTriggerEvents.CREATOR_ZOOM_CONNECTED, {
            creator_zoom_connected: ZoomAuthType.OAUTH,
          });
          // localStorage.setItem('user-details', JSON.stringify(localUserDetails));
          // message.success('Zoom successfully setup!');
          Modal.confirm({
            centered: true,
            title: 'Zoom account successfully connected',
            content: `We'll take care of creating and managing unique zoom meetings for all your sessions. So you can focus on what you love doing.`,
            onOk: () => history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.createSessions),
            okText: 'Create Session',
            onCancel: () => history.push(Routes.creatorDashboard.rootPath),
            cancelText: 'Go to Dashboard',
            closable: true,
          });
          // setTimeout is used for better user experince suggest by Rahul
          // setTimeout(() => {
          // if (isOnboarding) {
          //   history.push(Routes.session);
          // } else {
          //   history.push(Routes.creatorDashboard.rootPath);
          // }
          // }, 2000);
        }
      } catch (error) {
        message.error(error.response?.data?.message || 'Something went wrong.');
      }
      setIsLoading(false);
    },
    [history, setUserDetails]
  );

  useEffect(() => {
    if (code) {
      verifyZoomProfile(code);
    }
    //eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (history.location.pathname.includes('dashboard')) {
      setIsOnboarding(false);
    }
    setSelectedZoomOption(ZoomAuthType.OAUTH);
    // if (zoom_connected !== ZoomAuthType.NOT_CONNECTED) {
    //   setSelectedZoomOption(zoom_connected);
    // }
    if (zoom_connected === ZoomAuthType.JWT) {
      getZoomJWTDetails();
    }
  }, [history.location.pathname, zoom_connected, getZoomJWTDetails]);

  // Currently, this logic (used in JWT flow) is not used
  // Leaving this here in case we want to use it in the future
  const storeZoomCredentials = async (values) => {
    const eventTag = creator.click.livestream.submitZoomDetails;
    try {
      setIsLoading(true);
      const { status } = await apis.user.storeZoomCredentials(values);
      setIsLoading(false);
      if (isAPISuccess(status)) {
        trackSuccessEvent(eventTag);
        // message.success('Zoom successfully setup!');
        const localUserDetails = getLocalUserDetails();
        localUserDetails.zoom_connected = ZoomAuthType.JWT;
        setUserDetails(localUserDetails);
        pushToDataLayer(gtmTriggerEvents.CREATOR_ZOOM_CONNECTED, {
          creator_zoom_connected: ZoomAuthType.JWT,
        });

        Modal.success({
          centered: true,
          okText: 'Great',
          title: 'Zoom account successfully connected',
          content: `We'll take care of creating and managing unique zoom meetings for all your sessions. So you can focus on what you love doing.`,
          onOk: () => history.push(Routes.creatorDashboard.rootPath),
          closable: true,
        });
        // localStorage.setItem('user-details', JSON.stringify(localUserDetails));
        // setTimeout is used for better user experince suggest by Rahul
        // setTimeout(() => {
        //   if (isOnboarding) {
        //     history.push(Routes.session);
        //   } else {
        //     history.push(Routes.creatorDashboard.rootPath);
        //   }
        // }, 2000);
      }
    } catch (error) {
      setIsLoading(false);
      trackFailedEvent(eventTag, error);
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  const connectZoomAccount = () => {
    setIsLoading(true);
    window.open(config.zoom.oAuthURL, '_self');
    setIsLoading(false);
  };

  return (
    <>
      {isOnboarding && <OnboardSteps current={1} />}
      <Space size="small" direction="vertical" className={styles.mb20}>
        <Typography>
          <Title>Setup Livestream</Title>
        </Typography>

        {isOnboarding && <Link href={Routes.session}>Do it later</Link>}
      </Space>

      <Section>
        <Title level={4}>Setup your Zoom</Title>

        {/* <Row className={styles.zoomOption}>
          <label className={styles.accountSelectionLabel}>Ways to setup:</label>
          <Radio.Group onChange={(e) => setSelectedZoomOption(e.target.value)} value={selectedZoomOption}>
            <Radio value={ZoomAuthType.OAUTH}>Connect your Zoom account</Radio>
            <Radio value={ZoomAuthType.JWT}>Add your Zoom details</Radio>
          </Radio.Group>
        </Row> */}

        {selectedZoomOption === ZoomAuthType.OAUTH && (
          <Row align="center" className={styles.zoomConnectAccount}>
            {zoom_connected === ZoomAuthType.OAUTH || zoom_connected === ZoomAuthType.JWT ? (
              <>
                <Button type="primary" className={styles.success}>
                  Zoom account is connected
                </Button>
              </>
            ) : (
              <>
                <p className={styles.textAlignCenter}>
                  We will connect your Zoom Account. You will be taken to Zoom authorization page. You'll be taken back
                  to this page.
                </p>
                <Button
                  type="primary"
                  className={styles.mt30}
                  icon={<VideoCameraOutlined />}
                  onClick={() => {
                    connectZoomAccount();
                    trackSimpleEvent(creator.click.livestream.connectZoomAccount);
                  }}
                >
                  Connect my Zoom Account
                </Button>
              </>
            )}
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
                  Go to{' '}
                  <a href="https://marketplace.zoom.us" target="_blank" rel="noopener noreferrer">
                    https://marketplace.zoom.us
                  </a>{' '}
                  and Sign In.
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
              <Form form={form} {...profileFormItemLayout} onFinish={storeZoomCredentials}>
                <Col span={24}>
                  <Form.Item label="API Key" name="api_key" rules={validationRules.requiredValidation}>
                    <Input placeholder="API Key" />
                  </Form.Item>
                  <Form.Item label="API Secret" name="api_secret" rules={validationRules.requiredValidation}>
                    <Input.Password placeholder="API Secret" />
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
