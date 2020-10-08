import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { Form, Typography, Button, Space, Row, Col, Input, Card, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import parse from 'html-react-parser';
import apis from 'apis';
import Routes from 'routes';

import Section from '../../components/Section';
import Loader from '../../components/Loader';
import OnboardSteps from '../../components/OnboardSteps';
import ImageUpload from '../../components/ImageUpload';
import validationRules from '../../utils/validation';
import { profileFormItemLayout, profileFormTailLayout } from '../../layouts/FormLayouts';

import styles from './style.module.scss';

const { Title, Text } = Typography;

const Profile = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [coverImage, setCoverImage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [isPublicUrlAvaiable, setIsPublicUrlAvaiable] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [form] = Form.useForm();

  const getProfileDetails = useCallback(async () => {
    try {
      const { data } = await apis.user.getProfile();
      if (data) {
        form.setFieldsValue(data);
        setCoverImage(data.profile.cover_image_url);
        setProfileImage(data.profile.profile_image_url);
        setIsLoading(false);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoading(false);
    }
  }, [form]);

  const updateProfileDetails = async (values) => {
    try {
      const { data } = await apis.user.updateProfile(values);
      if (data) {
        form.setFieldsValue(data);
        setCoverImage(data.profile.cover_image_url);
        setProfileImage(data.profile.profile_image_url);
        setIsLoading(false);
        window.open(Routes.profilePreview);
        message.success('Profile successfully updated.');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  useEffect(() => {
    getProfileDetails();
  }, [getProfileDetails]);

  const onFinish = (values) => {
    setIsLoading(true);
    console.log('Success:', values);
    values.profile.cover_image_url = coverImage;
    values.profile.profile_image_url = coverImage;
    values.testimonials = testimonials;
    updateProfileDetails(values);
  };

  const onCoverImageUpload = ({ fileList: newFileList }) => {
    setCoverImage(newFileList[0]);
  };

  const onProfileImageUpload = ({ fileList: newFileList }) => {
    setProfileImage(newFileList[0]);
  };

  const handlePublicUrlChange = (e) => {
    if (e.target.value) {
      setIsPublicUrlAvaiable(true);
    } else {
      setIsPublicUrlAvaiable(false);
    }
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading profile">
      <OnboardSteps current={0} />
      <Space size="middle">
        <Typography>
          <Title>Setup your profile</Title>
        </Typography>
      </Space>

      <Form form={form} {...profileFormItemLayout} onFinish={onFinish}>
        {/* ========PRIMARY INFO======== */}
        <Section>
          <Title level={4}>1. Primary Information</Title>
          <p className={styles.subtext}>some text here - to be decieded later</p>

          <div className={styles.imageWrapper}>
            <ImageUpload
              aspect={2}
              className={classNames('avatar-uploader', styles.coverImage)}
              name="profile.cover_image_url"
              action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
              onChange={onCoverImageUpload}
              value={coverImage}
              label="Cover Photo"
            />

            <ImageUpload
              name="profile.profile_image_url"
              className={classNames('avatar-uploader', styles.profileImage)}
              action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
              onChange={onProfileImageUpload}
              value={profileImage}
              label="Profile Photo"
            />
          </div>
          <Form.Item label="Name" name="full_name" rules={validationRules.nameValidation}>
            <Input placeholder="Your Display Name" />
          </Form.Item>

          <Form.Item label="Short bio" name={['profile', 'description']}>
            <Input.TextArea rows={4} placeholder="Please input your short bio" />
          </Form.Item>

          <Form.Item label="Public URL">
            <Row align="middle" className={styles.alignUrl}>
              <Col>
                <Form.Item name="username" rules={validationRules.publicUrlValidation} onChange={handlePublicUrlChange}>
                  <Input placeholder="username" />
                </Form.Item>
              </Col>
              <Col className={classNames(styles.ml10)}>
                <Text>.is-now.live</Text>
              </Col>
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
                <Button
                  className={styles.mb10}
                  onClick={() => {
                    setTestimonials([...testimonials, form.getFieldValue().testimonials]);
                    form.setFieldsValue({ testimonials: '' });
                  }}
                >
                  <PlusOutlined /> Add
                </Button>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item {...profileFormTailLayout}>
            <Row>
              {testimonials?.map((item, index) => (
                <Col xs={24} md={24} key={index}>
                  {item && item.length ? (
                    <Card
                      title="Preview"
                      bordered={false}
                      extra={
                        <DeleteOutlined onClick={() => setTestimonials(testimonials.filter((_, i) => i !== index))} />
                      }
                      className={styles.m10}
                    >
                      {parse(item)}
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
