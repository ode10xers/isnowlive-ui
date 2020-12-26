import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import classNames from 'classnames';
import { Form, Typography, Button, Space, Row, Col, Input, Card, message, Spin } from 'antd';
import { DeleteOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import parse from 'html-react-parser';

import Routes from 'routes';
import apis from 'apis';
import Section from 'components/Section';
import Loader from 'components/Loader';
import OnboardSteps from 'components/OnboardSteps';
import ImageUpload from 'components/ImageUpload';
import TextEditor from 'components/TextEditor';
import EMCode from 'components/EMCode';
import validationRules from 'utils/validation';
import { parseEmbedCode, scrollToErrorField, isAPISuccess } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import { profileFormItemLayout, profileFormTailLayout, profileTestimonialTailLayout } from 'layouts/FormLayouts';
import { isMobileDevice } from 'utils/device';

import styles from './style.module.scss';
import {
  mixPanelEventTags,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';

const { Title, Text } = Typography;
const { creator } = mixPanelEventTags;

const Profile = () => {
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
      const { data } = await apis.user.getProfile();
      if (data) {
        const localUserDetails = getLocalUserDetails();
        if (!localUserDetails.profile_complete) {
          data.username = '';
        }
        form.setFieldsValue(data);
        setCoverImage(data.cover_image_url);
        setProfileImage(data.profile_image_url);
        setTestimonials(data.profile.testimonials);
        setIsLoading(false);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoading(false);
    }
  }, [form]);

  const updateProfileDetails = async (values) => {
    const eventTag = creator.click.profile.editForm.submitProfile;

    try {
      await apis.user.convertUserToCreator();

      const { status } = await apis.user.updateProfile(values);
      if (isAPISuccess(status)) {
        setIsLoading(false);
        trackSuccessEvent(eventTag, { form_values: values });
        message.success('Profile successfully updated.');
        const localUserDetails = getLocalUserDetails();
        localUserDetails.profile_complete = true;
        localStorage.setItem('user-details', JSON.stringify(localUserDetails));
        if (isOnboarding) {
          window.open(Routes.profilePreview);
          history.push(Routes.livestream);
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
    if (isPublicUrlAvaiable) {
      updateProfileDetails(values);
    } else {
      setIsLoading(false);
      message.error('Please enter valid username.');
    }
  };

  const onCoverImageUpload = (imageUrl) => {
    setCoverImage(imageUrl);
    form.setFieldsValue({
      ...form.getFieldsValue(),
      cover_image_url: imageUrl,
    });
  };

  const onProfileImageUpload = (imageUrl) => {
    setProfileImage(imageUrl);
    form.setFieldsValue({
      ...form.getFieldsValue(),
      profile_image_url: imageUrl,
    });
  };

  const handlePublicUrlChange = async (e) => {
    let regex = new RegExp('^[a-zA-Z]*$');
    if (regex.test(e.target.value)) {
      try {
        setIsLoadingUsernameCheck(true);
        const { data } = await apis.user.validUsernameCheck({
          username: e.target.value,
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

  const addTestimonial = () => {
    trackSimpleEvent(creator.click.profile.editForm.addEmbedCode);
    if (testimonials) {
      setTestimonials([...testimonials, form.getFieldValue().testimonials]);
      form.setFieldsValue({ testimonials: '' });
    } else {
      setTestimonials([form.getFieldValue().testimonials]);
      form.setFieldsValue({ testimonials: '' });
    }
  };

  const onFinishFailed = ({ errorFields }) => {
    scrollToErrorField(errorFields);
  };

  const trackAndNavigate = (destination, eventTag) => {
    trackSimpleEvent(eventTag);
    history.push(destination);
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading profile">
      {isOnboarding ? (
        <OnboardSteps current={0} />
      ) : (
        <Row>
          <Col span={24}>
            <Button
              className={styles.headButton}
              icon={<ArrowLeftOutlined />}
              onClick={() =>
                trackAndNavigate('/creator/dashboard/profile', creator.click.profile.editForm.backToProfile)
              }
            >
              Back
            </Button>
          </Col>
        </Row>
      )}
      <Space size="middle" className={!isOnboarding && styles.mt30}>
        <Typography>
          <Title> {isOnboarding ? 'Setup' : 'Update'} Public Profile</Title>
        </Typography>
      </Space>

      <Form form={form} {...profileFormItemLayout} onFinish={onFinish} onFinishFailed={onFinishFailed}>
        {/* ========PRIMARY INFO======== */}
        <Section>
          <Title level={4}>1. Primary Information</Title>
          <p className={styles.subtext}>some text here - to be decieded later</p>

          <div className={styles.imageWrapper}>
            <ImageUpload
              aspect={4}
              className={classNames('avatar-uploader', styles.coverImage)}
              name="cover_image_url"
              onChange={onCoverImageUpload}
              value={coverImage}
              label="Cover Photo"
            />

            <ImageUpload
              name="profile_image_url"
              className={classNames('avatar-uploader', styles.profileImage)}
              onChange={onProfileImageUpload}
              value={profileImage}
              label="Profile Photo"
            />
          </div>
          <Form.Item label="Name" className={styles.nameInputWrapper}>
            <Form.Item className={styles.nameInput} name="first_name" rules={validationRules.nameValidation}>
              <Input placeholder="First Name" />
            </Form.Item>
            <Form.Item className={styles.nameInput} name="last_name" rules={validationRules.nameValidation}>
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

          <Form.Item label="Public URL">
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
        </Section>

        {/* =========ONLINE PRESENCE==== */}
        <Section>
          <Title level={4}>2. Online Presence</Title>
          <p className={styles.subtext}>Let people know where else to follow you on social media</p>

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
        </Section>

        {/* ========TESTIMONIALS======== */}
        <Section>
          <Title level={4}>3. Testimonials</Title>
          <p className={styles.subtext}>Embed social media posts to add social proof on your public page</p>

          <Form.Item label="Embed code" name="testimonials">
            <Input.TextArea rows={4} placeholder="Please input your short bio" />
          </Form.Item>
          <Form.Item {...profileFormTailLayout}>
            <Row>
              <Col xs={24}>
                <Button className={styles.mb10} onClick={() => addTestimonial()}>
                  <PlusOutlined /> Add
                </Button>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item {...(!isMobileDevice && profileTestimonialTailLayout)}>
            <Row>
              {testimonials?.map((item, index) => (
                <Col xs={24} md={24} lg={12} key={index}>
                  {item && item.length ? (
                    <Card
                      title="Preview"
                      bordered={false}
                      extra={
                        <DeleteOutlined
                          onClick={() => {
                            trackSimpleEvent(mixPanelEventTags.creator.click.profile.editForm.deleteEmbedCode);
                            setTestimonials(testimonials.filter((_, i) => i !== index));
                          }}
                        />
                      }
                      className={styles.card}
                      bodyStyle={{ padding: '0px', height: '600px', overflowY: 'scroll' }} // styles.cardbody is not working here
                    >
                      <EMCode>{parseEmbedCode(parse(item))}</EMCode>
                    </Card>
                  ) : null}
                </Col>
              ))}
            </Row>
          </Form.Item>
        </Section>

        {/* ====PREVIEW AND PUBLISH====== */}
        <Section>
          <Row justify="center">
            <Col>
              <Form.Item>
                <Button htmlType="submit" type="primary">
                  Publish Page
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Section>
      </Form>
    </Loader>
  );
};

export default Profile;
