import React, { useState } from 'react';
import { Form, Input, Collapse, message, Row, Col, Upload, Button } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import classNames from 'classnames';

import Routes from 'routes';
import apis from 'apis';

import { useGlobalContext } from 'services/globalContext';
import {
  mixPanelEventTags,
  mapUserToMixPanel,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';
import { gtmTriggerEvents, pushToDataLayer } from 'services/integrations/googleTagManager';

import validationRules from 'utils/validation';
import TextEditor from 'components/TextEditor';

import styles from './style.module.scss';

const { Panel } = Collapse;

const { Item } = Form;
const { user } = mixPanelEventTags;

const Onboarding = ({ history }) => {
  const [form] = Form.useForm();
  const { logIn } = useGlobalContext();
  const [isLoading, setIsLoading] = useState(false);

  const onFinish = async (values) => {
    const eventTag = user.click.signUp;
    const referenceCode = JSON.parse(localStorage.getItem('ref'));
    try {
      setIsLoading(true);
      const { data } = await apis.user.signup({
        email: values.email,
        is_creator: true,
        referrer: referenceCode,
      });
      if (data) {
        pushToDataLayer(gtmTriggerEvents.CREATOR_SIGNUP, {
          creator_email: values.email,
          creator_external_id: data.external_id,
        });
        logIn(data, true);
        setIsLoading(false);
        mapUserToMixPanel(data);
        localStorage.removeItem('ref');
        trackSuccessEvent(eventTag, { email: values.email });
        history.push(Routes.profile);
      }
    } catch (error) {
      setIsLoading(false);
      trackFailedEvent(eventTag, error, { email: values.email });
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  const callbackCollapse = (key) => {
    console.log(key);
  };

  return (
    <Row>
      <Col span={8} offset={1}>
        <Form form={form} onFinish={onFinish} scrollToFirstError={true}>
          <Collapse defaultActiveKey={['1']} onChange={callbackCollapse}>
            <Panel header="Header" key="header">
              <Form.Item
                id="cover_image_url"
                name="cover_image_url"
                rules={validationRules.requiredValidation}
                label="Cover Photo"
              >
                <Upload>
                  <Button icon={<UploadOutlined />}>Upload</Button>
                </Upload>
              </Form.Item>

              <Form.Item
                id="profile_image_url"
                name="profile_image_url"
                rules={validationRules.requiredValidation}
                label="Your Photo"
              >
                <Upload>
                  <Button icon={<UploadOutlined />}>Upload</Button>
                </Upload>
              </Form.Item>

              <Form.Item required className={styles.nameInputWrapper} label="Name">
                <Form.Item
                  className={styles.nameInput}
                  style={{ display: 'inline-block', width: 'calc(50% - 12px)' }}
                  name="first_name"
                  rules={validationRules.nameValidation}
                >
                  <Input placeholder="First Name" />
                </Form.Item>
                <Form.Item
                  className={styles.nameInput}
                  style={{ display: 'inline-block', width: 'calc(50% - 12px)' }}
                  name="last_name"
                  rules={validationRules.nameValidation}
                >
                  <Input placeholder="Last Name" />
                </Form.Item>
              </Form.Item>

              <Form.Item
                className={classNames(styles.bgWhite, styles.textEditorLayout)}
                label="Short bio"
                name={['profile', 'bio']}
              >
                <TextEditor name={['profile', 'bio']} form={form} placeholder="  Please input your short bio" />
              </Form.Item>
            </Panel>
            <Panel header="Social Links" key="social">
              <Form.Item label="Website" name={['profile', 'social_media_links', 'website']}>
                <Input placeholder="Your website link" />
              </Form.Item>

              <Form.Item label="Facebook" name={['profile', 'social_media_links', 'facebook_link']}>
                <Input placeholder="Facebook profile link" />
              </Form.Item>

              <Form.Item label="Twitter" name={['profile', 'social_media_links', 'twitter_link']}>
                <Input placeholder="Twitter profile link" />
              </Form.Item>

              <Form.Item label="Instagram" name={['profile', 'social_media_links', 'instagram_link']}>
                <Input placeholder="Instagram profile link" />
              </Form.Item>

              <Form.Item label="LinkedIn" name={['profile', 'social_media_links', 'linkedin_link']}>
                <Input placeholder="LinkedIn profile link" />
              </Form.Item>
            </Panel>
            <Panel header="Other Links" key="other"></Panel>
          </Collapse>
        </Form>
      </Col>
    </Row>
  );
};

export default Onboarding;
