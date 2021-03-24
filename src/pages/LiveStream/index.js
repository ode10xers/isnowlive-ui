import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { Form, Typography, Button, Space, Row, Col, Input, Radio, message } from 'antd';

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
import { useTranslation, Trans } from 'react-i18next';

const { Title, Link } = Typography;
const { creator } = mixPanelEventTags;

const LiveStream = () => {
  const { t: translate } = useTranslation();
  const [form] = Form.useForm();
  const history = useHistory();
  const location = useLocation();
  const [selectedZoomOption, setSelectedZoomOption] = useState(ZoomAuthType.JWT);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnboarding, setIsOnboarding] = useState(true);
  const {
    state: {
      userDetails: { zoom_connected = 'NOT_CONNECTED' },
    },
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
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
    }
  }, [form, translate]);

  const verifyZoomProfile = useCallback(
    async (code) => {
      try {
        const { status } = await apis.user.authZoom(code);
        if (isAPISuccess(status)) {
          const localUserDetails = getLocalUserDetails();
          localUserDetails.zoom_connected = ZoomAuthType.OAUTH;
          localStorage.setItem('user-details', JSON.stringify(localUserDetails));
          message.success(translate('ZOOM_SUCCESSFULLY_SETUP'));
          // setTimeout is used for better user experince suggest by Rahul
          setTimeout(() => {
            if (isOnboarding) {
              history.push(Routes.session);
            } else {
              history.push(Routes.creatorDashboard.rootPath);
            }
          }, 2000);
        }
      } catch (error) {
        message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
      }
    },
    [history, isOnboarding, translate]
  );

  useEffect(() => {
    if (code) {
      verifyZoomProfile(code);
    }
  }, [code, verifyZoomProfile]);

  useEffect(() => {
    if (history.location.pathname.includes('dashboard')) {
      setIsOnboarding(false);
    }
    if (zoom_connected !== ZoomAuthType.NOT_CONNECTED) {
      setSelectedZoomOption(zoom_connected);
    }
    if (zoom_connected === ZoomAuthType.JWT) {
      getZoomJWTDetails();
    }
  }, [history.location.pathname, zoom_connected, getZoomJWTDetails]);

  const storeZoomCredentials = async (values) => {
    const eventTag = creator.click.livestream.submitZoomDetails;
    try {
      setIsLoading(true);
      const { status } = await apis.user.storeZoomCredentials(values);
      setIsLoading(false);
      if (isAPISuccess(status)) {
        trackSuccessEvent(eventTag);
        message.success(translate('ZOOM_SUCCESSFULLY_SETUP'));
        const localUserDetails = getLocalUserDetails();
        localUserDetails.zoom_connected = ZoomAuthType.JWT;
        localStorage.setItem('user-details', JSON.stringify(localUserDetails));
        // setTimeout is used for better user experince suggest by Rahul
        setTimeout(() => {
          if (isOnboarding) {
            history.push(Routes.session);
          } else {
            history.push(Routes.creatorDashboard.rootPath);
          }
        }, 2000);
      }
    } catch (error) {
      setIsLoading(false);
      trackFailedEvent(eventTag, error);
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
    }
  };

  const connectZoomAccount = () => {
    window.open(config.zoom.oAuthURL, '_self');
  };

  return (
    <>
      {isOnboarding && <OnboardSteps current={1} />}
      <Space size="small" direction="vertical" className={styles.mb20}>
        <Typography>
          <Title>{translate('SETUP_LIVESTREAM')}</Title>
        </Typography>

        {isOnboarding && <Link href={Routes.session}>{translate('DO_IT_LATER')}</Link>}
      </Space>

      <Section>
        <Title level={4}>{translate('SETUP_YOUR_ZOOM')}</Title>

        <Row className={styles.zoomOption}>
          <label className={styles.accountSelectionLabel}>{translate('WAYS_TO_SETUP')}:</label>
          <Radio.Group onChange={(e) => setSelectedZoomOption(e.target.value)} value={selectedZoomOption}>
            <Radio value={ZoomAuthType.OAUTH}>{translate('CONNECT_YOUR_ZOOM_ACCOUNT')}</Radio>
            <Radio value={ZoomAuthType.JWT}>{translate('ADD_YOUR_ZOOM_DETAILS')}</Radio>
          </Radio.Group>
        </Row>

        {selectedZoomOption === ZoomAuthType.OAUTH && (
          <Row align="center" className={styles.zoomConnectAccount}>
            {zoom_connected === ZoomAuthType.OAUTH ? (
              <>
                <Button type="primary" className={styles.success}>
                  {translate('ZOOM_ACCOUNT_IS_CONNECTED')}
                </Button>
              </>
            ) : (
              <>
                <p className={styles.textAlignCenter}>{translate('LIVESTREAM_TEXT1')}</p>
                <Button
                  type="primary"
                  className={styles.mt30}
                  onClick={() => {
                    connectZoomAccount();
                    trackSimpleEvent(creator.click.livestream.connectZoomAccount);
                  }}
                >
                  {translate('CONNECT_MY_ZOOM_ACCOUNT')}
                </Button>
              </>
            )}
          </Row>
        )}
        {selectedZoomOption === ZoomAuthType.JWT && (
          <Row className={styles.zoomConnectAccountForm}>
            <Col span={24}>
              <p>
                {translate('LIVESTREAM_TEXT2')} <a href>{translate('LIVESTREAM_TEXT3')}</a>
              </p>
              <p>{translate('LIVESTREAM_TEXT4')}</p>
              <p>{translate('LIVESTREAM_TEXT5')}</p>
            </Col>
            <Col span={24}>
              <Title level={3}>{translate('SETTING_UP_THE_INTEGRATION')}</Title>
              <p>
                {translate('LIVESTREAM_TEXT6')} <strong>API Key, API Secret,</strong> {translate('AND')}{' '}
                <strong>{translate('EMAIL')}</strong> {translate('LIVESTREAM_TEXT7')}
              </p>
              <ol>
                <li>
                  {translate('GO_TO')}{' '}
                  <a href="https://marketplace.zoom.us" target="_blank" rel="noopener noreferrer">
                    https://marketplace.zoom.us
                  </a>{' '}
                  {translate('LIVESTREAM_TEXT8')}
                </li>
                <li>{translate('LIVESTREAM_TEXT9')}</li>
                <li>{translate('LIVESTREAM_TEXT10')}</li>
                <li>{translate('LIVESTREAM_TEXT11')}</li>
                <li>{translate('LIVESTREAM_TEXT12')}</li>
                <li>
                  {translate('LIVESTREAM_TEXT13')} <strong>API Key, API Secret,</strong> {translate('AND')}{' '}
                  <strong>{translate('EMAIL')}</strong> {translate('LIVESTREAM_TEXT14')}
                </li>
              </ol>
              <p>
                <strong>{translate('NOTE')}:</strong>
                {translate('LIVESTREAM_TEXT15')} ({translate('AT')} <a href>zoom.us</a>),{' '}
                {translate('LIVESTREAM_TEXT16')}{' '}
                <em>
                  <Trans i18nKey="LIVESTREAM_TEXT17">
                    Use Personal Meeting ID (PMI) when scheduling a meeting is turned <strong>off</strong>
                  </Trans>
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
                  <Form.Item label={translate('EMAIL')} name="email" rules={validationRules.emailValidation}>
                    <Input placeholder={translate('EMAIL')} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Row justify="center">
                    <Col>
                      <Form.Item>
                        <Button htmlType="submit" type="primary" loading={isLoading}>
                          {translate('SUBMIT')}
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
