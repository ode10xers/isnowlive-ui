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
import { useTranslation } from 'react-i18next';

const { Title, Text, Paragraph } = Typography;
const { creator } = mixPanelEventTags;

const Profile = () => {
  const { t: translate } = useTranslation();
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
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
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
        message.success(translate('PROFILE_UPDATE_SUCCESS'));
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
      message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
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
      message.error(translate('ENTER_VALID_USERNAME'));
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
        message.error(error.response?.data?.message || translate('SOMETHING_WENT_WRONG'));
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
              {translate('BACK')}
            </Button>
          </Col>
        </Row>
      )}
      <Space size="middle" className={!isOnboarding && styles.mt30}>
        <Typography>
          <Title>
            {' '}
            {isOnboarding ? translate('SETUP') : translate('UPDATE')} {translate('PUBLIC_PROFILE')}
          </Title>
        </Typography>
      </Space>

      <Form
        form={form}
        {...profileFormItemLayout}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        labelAlign={isMobileDevice ? 'left' : 'right'}
        scrollToFirstError={true}
      >
        {/* ========PRIMARY INFO======== */}
        <Section>
          <Title level={4}>{translate('1_PRIMARY_INFO')}</Title>
          <Paragraph className={styles.mt10} type="secondary">
            {translate('1_PRIMARY_INFO_TEXT')}
          </Paragraph>
          <div className={styles.imageWrapper}>
            <ImageUpload
              aspect={4}
              className={classNames('avatar-uploader', styles.coverImage)}
              name="cover_image_url"
              onChange={onCoverImageUpload}
              value={coverImage}
              label={translate('COVER_PHOTO')}
            />

            <ImageUpload
              name="profile_image_url"
              className={classNames('avatar-uploader', styles.profileImage)}
              onChange={onProfileImageUpload}
              value={profileImage}
              label={translate('PROFILE_PHOTO')}
            />
          </div>
          <Form.Item label={translate('NAME')} className={styles.nameInputWrapper}>
            <Form.Item className={styles.nameInput} name="first_name" rules={validationRules.nameValidation}>
              <Input placeholder={translate('FIRST_NAME')} />
            </Form.Item>
            <Form.Item className={styles.nameInput} name="last_name" rules={validationRules.nameValidation}>
              <Input placeholder={translate('LAST_NAME')} />
            </Form.Item>
          </Form.Item>

          <Form.Item
            className={classNames(styles.bgWhite, styles.textEditorLayout)}
            label={translate('SHORT_BIO')}
            name={['profile', 'bio']}
          >
            <TextEditor name={['profile', 'bio']} form={form} placeholder={translate('SHORT_BIO_PLACEHOLDER')} />
          </Form.Item>

          <Form.Item label={translate('PUBLIC_URL')}>
            <Row align="middle" className={styles.alignUrl}>
              <Col>
                <Form.Item name="username" rules={validationRules.publicUrlValidation} onBlur={handlePublicUrlChange}>
                  <Input placeholder={translate('USERNAME')} />
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
                      <span className={classNames(styles.dot, styles.success)}></span> {translate('AVAILABLE')}
                    </Text>
                  ) : (
                    <Text type="danger">
                      <span className={classNames(styles.dot, styles.danger)}></span> {translate('UNAVAILABLE')}
                    </Text>
                  )}
                </Col>
              )}
            </Row>
          </Form.Item>
        </Section>

        {/* =========ONLINE PRESENCE==== */}
        <Section>
          <Title level={4}>{translate('2_ONLINE_PRESENCE')}</Title>
          <p className={styles.subtext}>{translate('2_ONLINE_PRESENCE_TEXT')}</p>

          <Form.Item label={translate('WEBSITE')} name={['profile', 'social_media_links', 'website']}>
            <Input placeholder={translate('WEBSITE_PLACEHOLDER')} />
          </Form.Item>

          <Form.Item label={translate('FACEBOOK')} name={['profile', 'social_media_links', 'facebook_link']}>
            <Input placeholder={translate('FACEBOOK_PLACEHOLDER')} />
          </Form.Item>

          <Form.Item label={translate('TWITTER')} name={['profile', 'social_media_links', 'twitter_link']}>
            <Input placeholder={translate('TWITTER_PLACEHOLDER')} />
          </Form.Item>

          <Form.Item label={translate('INSTAGRAM')} name={['profile', 'social_media_links', 'instagram_link']}>
            <Input placeholder={translate('INSTAGRAM_PLACEHOLDER')} />
          </Form.Item>

          <Form.Item label={translate('LINKEDIN')} name={['profile', 'social_media_links', 'linkedin_link']}>
            <Input placeholder={translate('LINKEDIN_PLACEHOLDER')} />
          </Form.Item>
        </Section>

        {/* ========TESTIMONIALS======== */}
        <Section>
          <Title level={4}>{translate('3_TESTIMONIAL')}</Title>
          <p className={styles.subtext}>{translate('3_TESTIMONIAL_TEXT')}</p>

          <Form.Item label={translate('EMBED_CODE')} name="testimonials">
            <Input.TextArea rows={4} placeholder={translate('EMBED_CODE_PLACEHOLDER')} />
          </Form.Item>
          <Form.Item {...profileFormTailLayout}>
            <Row>
              <Col xs={24}>
                <Button className={styles.mb10} onClick={() => addTestimonial()}>
                  <PlusOutlined /> {translate('ADD')}
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
                      title={translate('PREVIEW')}
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
                  {translate('PUBLISH_PAGE')}
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
