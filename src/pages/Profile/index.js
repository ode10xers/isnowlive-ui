import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import classNames from 'classnames';
import { Form, Typography, Button, Space, Row, Col, Input, Card, message, Spin, Modal, Collapse } from 'antd';
import { DeleteOutlined, PlusOutlined, ArrowLeftOutlined, CopyOutlined, CheckCircleOutlined } from '@ant-design/icons';
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
import { parseEmbedCode, isAPISuccess, generateUrlFromUsername } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import { isMobileDevice } from 'utils/device';

import { profileFormItemLayout, profileFormTailLayout, profileTestimonialTailLayout } from 'layouts/FormLayouts';

import {
  mixPanelEventTags,
  trackSimpleEvent,
  trackSuccessEvent,
  trackFailedEvent,
} from 'services/integrations/mixpanel';
import { gtmTriggerEvents, customNullValue, pushToDataLayer } from 'services/integrations/googleTagManager';
import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Title, Text, Paragraph, Link } = Typography;
const { Panel } = Collapse;
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
      const localUserDetails = getLocalUserDetails();

      await apis.user.convertUserToCreator();

      const { status } = await apis.user.updateProfile(values);
      if (isAPISuccess(status)) {
        setIsLoading(false);
        trackSuccessEvent(eventTag, { form_values: values });
        message.success('Profile successfully updated.');
        localUserDetails.profile_complete = true;
        localUserDetails.is_creator = true;
        localUserDetails.first_name = values.first_name;
        localUserDetails.last_name = values.last_name;
        localUserDetails.username = values.username;

        pushToDataLayer(gtmTriggerEvents.CREATOR_PROFILE_COMPLETE, {
          creator_external_id: localUserDetails.external_id,
          creator_email: localUserDetails.email,
          creator_email_verified: localUserDetails.email_verified,
          is_creator: localUserDetails.is_creator,
          creator_first_name: values.first_name,
          creator_last_name: values.last_name,
          creator_username: values.username || customNullValue,
          creator_profile_complete: localUserDetails.profile_complete,
          creator_payment_account_status: localUserDetails.payment_account_status,
          creator_payment_currency: localUserDetails.currency || customNullValue,
          creator_zoom_connected: localUserDetails.zoom_connected,
        });

        setUserDetails(localUserDetails);

        if (isOnboarding) {
          const creatorUrl = generateUrlFromUsername(values.username);

          const newWindow = window.open(creatorUrl + Routes.profilePreview);
          newWindow.blur();
          window.focus();
          // history.push(Routes.livestream);

          const modalRef = Modal.success({
            width: 550,
            okButtonProps: { style: { display: 'none' } },
            title: 'Awesome! Your public website is ready',
            content: (
              <Row gutter={[8, 12]}>
                <Col xs={24}>
                  <Paragraph>You can now share your website</Paragraph>
                  <Paragraph>
                    <Link
                      href={creatorUrl}
                      target="_blank"
                      copyable={{
                        icon: [
                          <Button ghost type="primary" size="small" icon={<CopyOutlined />}>
                            {' '}
                            Copy{' '}
                          </Button>,
                          <Button type="primary" size="small" icon={<CheckCircleOutlined />}>
                            {' '}
                            Copied!{' '}
                          </Button>,
                        ],
                      }}
                    >
                      {creatorUrl}
                    </Link>
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
                          history.push(Routes.session);
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

      <Form
        form={form}
        {...profileFormItemLayout}
        onFinish={onFinish}
        labelAlign={isMobileDevice ? 'left' : 'right'}
        onFinishFailed={() => window.scrollTo(0, 440)}
      >
        {/* ========PRIMARY INFO======== */}
        <Section>
          <Title level={4}>1. Primary Information</Title>
          <Paragraph className={styles.mt10} type="secondary">
            This is your public page on the internet, add a great closeup picture or your logo, a cover to define your
            page and an a brief description to showcase yourself to your attendees.
          </Paragraph>
          <div className={styles.imageWrapper}>
            <Form.Item
              id="cover_image_url"
              name="cover_image_url"
              rules={validationRules.requiredValidation}
              wrapperCol={{ span: 24 }}
              className={styles.coverImageWrapper}
            >
              <ImageUpload
                aspect={4}
                className={classNames('avatar-uploader', styles.coverImage)}
                name="cover_image_url"
                onChange={onCoverImageUpload}
                value={coverImage}
                label={
                  <>
                    <Text type="danger">*</Text> Cover Photo{' '}
                  </>
                }
              />
            </Form.Item>

            <Form.Item
              id="profile_image_url"
              name="profile_image_url"
              rules={validationRules.requiredValidation}
              wrapperCol={{ span: 24 }}
              className={styles.profileImageWrapper}
            >
              <ImageUpload
                name="profile_image_url"
                className={classNames('avatar-uploader', styles.profileImage)}
                onChange={onProfileImageUpload}
                value={profileImage}
                label={
                  <>
                    <Text type="danger">*</Text> Profile Photo{' '}
                  </>
                }
              />
            </Form.Item>
          </div>
          <Form.Item label="Name" required className={styles.nameInputWrapper}>
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

          <Form.Item label="Public URL" required>
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

        <Section>
          <Collapse>
            {/* =========ONLINE PRESENCE==== */}
            <Panel header={<Title level={5}>2. Your other web links (Optional)</Title>} key="web_links">
              <p className={styles.subtext}>Let people know where else to follow you on the internet</p>

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

            {/* ========TESTIMONIALS======== */}
            <Panel
              header={<Title level={5}>3. Social testimonials from customers (Optional)</Title>}
              key="testimonials"
            >
              <p className={styles.subtext}>
                Get the embed code (not the normal link) from Instagram, Facebook, LinkedIn, Twitter, or any other
                social media and see the preview once you add it
              </p>

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
            </Panel>
          </Collapse>
        </Section>
        {/*}

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

*/}
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
