import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import classNames from 'classnames';
import { Form, Typography, Button, Space, Row, Col, Input, message, Spin, Modal } from 'antd';
import { CopyOutlined, CheckCircleOutlined } from '@ant-design/icons';

import Routes from 'routes';
import apis from 'apis';

import Loader from 'components/Loader';

import validationRules from 'utils/validation';
import { isAPISuccess, generateUrlFromUsername } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import { isMobileDevice } from 'utils/device';

import { mixPanelEventTags, trackSuccessEvent, trackFailedEvent } from 'services/integrations/mixpanel';
import { gtmTriggerEvents, customNullValue, pushToDataLayer } from 'services/integrations/googleTagManager';
import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Text, Paragraph, Link } = Typography;
const { creator } = mixPanelEventTags;

const Profile = () => {
  const { setUserDetails } = useGlobalContext();
  const [isLoading, setIsLoading] = useState(true);
  const [coverImage, setCoverImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [isLoadingUsernameCheck, setIsLoadingUsernameCheck] = useState(false);
  const [isPublicUrlAvaiable, setIsPublicUrlAvaiable] = useState(true);
  const [testimonials, setTestimonials] = useState([]);
  const [isOnboarding, setIsOnboarding] = useState(true);
  const [form] = Form.useForm();
  const history = useHistory();

  const getProfileDetails = useCallback(async () => {
    try {
      const { status, data } = await apis.user.getProfile();
      if (isAPISuccess(status) && data) {
        const localUserDetails = getLocalUserDetails();
        if (!localUserDetails.profile_complete) {
          data.username = '';
        }
        form.setFieldsValue(data);
        setCoverImage(data.cover_image_url);
        setProfileImage(data.profile_image_url);
        setTestimonials(data.profile?.testimonials || []);
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoading(false);
    }
  }, [form]);

  const showCreatorProfilePreview = (creatorUrl) => {
    const newWindow = window.open(creatorUrl);
    newWindow.blur();
    window.focus();
  };

  const updateProfileDetails = async (values) => {
    const eventTag = creator.click.profile.editForm.submitProfile;

    try {
      let localUserDetails = getLocalUserDetails();

      if (!localUserDetails.is_creator) {
        await apis.user.convertUserToCreator();
      }

      const { status, data } = await apis.user.updateProfile(values);
      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        trackSuccessEvent(eventTag, { form_values: values });
        message.success('Profile successfully updated.');
        localUserDetails = data;

        pushToDataLayer(gtmTriggerEvents.CREATOR_PROFILE_COMPLETE, {
          creator_external_id: localUserDetails.external_id,
          creator_email: localUserDetails.email,
          creator_email_verified: localUserDetails.email_verified,
          is_creator: localUserDetails.is_creator,
          creator_first_name: values.first_name,
          creator_last_name: values.last_name,
          creator_username: values.username || customNullValue,
          creator_profile_complete: localUserDetails.profile_complete,
          creator_payment_account_status: localUserDetails.profile?.payment_account_status || customNullValue,
          creator_payment_currency: localUserDetails.profile?.currency || customNullValue,
          creator_zoom_connected: localUserDetails.profile?.zoom_connected || customNullValue,
        });

        setUserDetails(localUserDetails);

        if (isOnboarding) {
          const creatorUrl = generateUrlFromUsername(values.username);

          const modalRef = Modal.success({
            width: 550,
            okButtonProps: { style: { display: 'none' } },
            title: 'Awesome! Your public website is ready',
            content: (
              <Row gutter={[8, 12]}>
                <Col xs={24}>
                  <Paragraph>You can now share your website</Paragraph>
                  <Paragraph>
                    <Space>
                      <Link
                        href={creatorUrl}
                        target="_blank"
                        copyable={{
                          icon: [
                            <Button ghost type="primary" size="small" icon={<CopyOutlined />}>
                              Copy
                            </Button>,
                            <Button type="primary" size="small" icon={<CheckCircleOutlined />}>
                              Copied!
                            </Button>,
                          ],
                        }}
                      >
                        {creatorUrl}
                      </Link>
                      <Button size="small" type="primary" onClick={() => showCreatorProfilePreview(creatorUrl)}>
                        Show me!
                      </Button>
                    </Space>
                  </Paragraph>
                  <Paragraph>on your social media or with your audience.</Paragraph>
                  <Paragraph>Now let's get your sessions or videos setup for them to start buying</Paragraph>
                </Col>
                <Col xs={24}>
                  <Row gutter={[8, 8]} justify="space-around">
                    <Col xs={24} md={12}>
                      <Button
                        block
                        type="primary"
                        onClick={() => {
                          history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.videos, {
                            onboarding: true,
                          });
                          modalRef.destroy();
                        }}
                      >
                        Upload a Video
                      </Button>
                    </Col>
                    <Col xs={24} md={12}>
                      <Button
                        block
                        type="primary"
                        className={styles.greenBtn}
                        onClick={() => {
                          history.push(Routes.sessionCreate);
                          window.scrollTo(0, 0);
                          modalRef.destroy();
                        }}
                      >
                        Schedule a Session
                      </Button>
                    </Col>
                    <Col xs={24} md={12}>
                      <Button
                        block
                        type="link"
                        onClick={() => {
                          history.push(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.defaultPath);
                          modalRef.destroy();
                        }}
                      >
                        I'll do these later
                      </Button>
                    </Col>
                  </Row>
                </Col>
              </Row>
            ),
          });
        } else {
          history.push('/creator/dashboard/profile');
        }
      }
    } catch (error) {
      setIsLoading(false);
      trackFailedEvent(eventTag, error, { form_values: values });
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  useEffect(() => {
    if (history.location.pathname.includes('dashboard')) {
      setIsOnboarding(false);
    }
    getProfileDetails();
  }, [getProfileDetails, history.location.pathname]);

  const onFinish = (values) => {
    setIsLoading(true);
    values.cover_image_url = coverImage;
    values.profile_image_url = profileImage;
    values.profile.testimonials = testimonials;

    // TODO: Right now, the category is hard coded to YOGA
    // Later we'll need to make a dropdown of choices
    values.profile.category = 'YOGA';

    if (isPublicUrlAvaiable) {
      updateProfileDetails(values);
    } else {
      setIsLoading(false);
      message.error('Please enter valid username.');
    }
  };

  const handlePublicUrlChange = async (e) => {
    let regex = new RegExp('^[a-z]*$');
    if (regex.test(e.target.value)) {
      try {
        setIsLoadingUsernameCheck(true);
        const { data } = await apis.user.validUsernameCheck({
          username: e.target.value?.toLowerCase(),
        });
        if (data) {
          setIsPublicUrlAvaiable(true);
        } else {
          setIsPublicUrlAvaiable(false);
        }
        setIsLoadingUsernameCheck(false);
      } catch (error) {
        setIsLoadingUsernameCheck(false);
        message.error(error.response?.data?.message || 'Something went wrong.');
      }
    }
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading profile">
      <div className={styles.signupContainer}>
        <div className={styles.signupHeadingText}>Name your Site</div>
        <div className={styles.signupHeadingSubtext}>Set a public URL for your website</div>
        <div className={styles.signupForm}>
          <Form
            form={form}
            onFinish={onFinish}
            labelAlign={isMobileDevice ? 'left' : 'right'}
            scrollToFirstError={true}
          >
            <Form.Item required className={styles.nameInputWrapper}>
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

            <Form.Item required>
              <Row align="middle" className={styles.alignUrl}>
                <Col>
                  <Form.Item name="username" rules={validationRules.publicUrlValidation} onBlur={handlePublicUrlChange}>
                    <Input placeholder="username" />
                  </Form.Item>
                </Col>
                <Col className={classNames(styles.ml10)}>
                  <Text>.passion.do</Text>
                </Col>
                {isLoadingUsernameCheck ? (
                  <Col className={classNames(styles.ml10)}>
                    <Spin />
                  </Col>
                ) : (
                  <Col className={classNames(styles.ml10)}>
                    {isPublicUrlAvaiable ? (
                      <Text type="success">
                        <span className={classNames(styles.dot, styles.success)}></span> Available
                      </Text>
                    ) : (
                      <Text type="danger">
                        <span className={classNames(styles.dot, styles.danger)}></span> Unavailable
                      </Text>
                    )}
                  </Col>
                )}
              </Row>
            </Form.Item>

            <Form.Item>
              <Button className={styles.signupButton} htmlType="submit" type="primary">
                Continue
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </Loader>
  );
};

export default Profile;
