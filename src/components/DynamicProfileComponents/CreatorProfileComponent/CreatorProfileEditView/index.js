import React, { useState, useEffect } from 'react';
import classNames from 'classnames';
import { Modal, Row, Col, Input, Button, Form, Typography, Collapse, Spin, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';

import apis from 'apis';

import { resetBodyStyle, showErrorModal } from 'components/Modals/modals';
import ImageUpload from 'components/ImageUpload';
import TextEditor from 'components/TextEditor';

import validationRules from 'utils/validation';
import { getLocalUserDetails } from 'utils/storage';
import { isAPISuccess, preventDefaults } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Text, Title } = Typography;
const { Panel } = Collapse;

const creatorUsernameRegex = new RegExp('^[a-z]*$');

// TODO: Think about the New Creator Flow
// TODO: Implement Testimonials Once decided
const CreatorProfileEditView = ({ creatorProfile, refetchCreatorProfileData = () => {} }) => {
  const { setUserDetails } = useGlobalContext();
  const [form] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [coverImageURL, setCoverImageURL] = useState(null);
  const [profileImageURL, setProfileImageURL] = useState(null);
  const [isPublicURLAvailable, setIsPublicURLAvailable] = useState(true);
  const [isLoadingUsernameCheck, setIsLoadingUsernameCheck] = useState(false);

  useEffect(() => {
    if (creatorProfile && editModalVisible) {
      let profile = {
        bio: '',
        social_media_links: {
          website: '',
          instagram_link: '',
          linkedin_link: '',
          twitter_link: '',
          facebook_link: '',
        },
      };
      if (creatorProfile.profile) {
        profile = {
          bio: creatorProfile.profile.bio,
          social_media_links: creatorProfile.profile.social_media_links,
        };
      }

      form.setFieldsValue({
        first_name: creatorProfile.first_name,
        last_name: creatorProfile.last_name,
        cover_image_url: creatorProfile.cover_image_url,
        profile_image_url: creatorProfile.profile_image_url,
        username: creatorProfile.username,
        profile: profile,
      });

      setCoverImageURL(creatorProfile.cover_image_url);
      setProfileImageURL(creatorProfile.profile_image_url);
    } else {
      form.resetFields();
      setCoverImageURL(null);
      setProfileImageURL(null);
    }

    setIsPublicURLAvailable(true);
    setIsLoadingUsernameCheck(false);
  }, [creatorProfile, editModalVisible, form]);

  const handleEditComponentClicked = (e) => {
    preventDefaults(e);
    setEditModalVisible(true);
  };

  const cancelEditChanges = (e) => {
    preventDefaults(e);
    setEditModalVisible(false);
  };

  // TODO: Implement GTM and other Events here once decided
  const handleFinishEditComponent = async (values) => {
    setIsLoading(true);
    try {
      const { status } = await apis.user.updateProfile(values);

      if (isAPISuccess(status)) {
        const localUserDetails = getLocalUserDetails();
        localUserDetails.profile_complete = true;
        localUserDetails.is_creator = true;
        localUserDetails.first_name = values.first_name;
        localUserDetails.last_name = values.last_name;
        localUserDetails.username = values.username;

        setUserDetails(localUserDetails);

        refetchCreatorProfileData();
        setEditModalVisible(false);
      }
    } catch (error) {
      showErrorModal('Failed updating creator profile', error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  };

  const onCoverImageUploaded = (uploadedCoverImageURL = null) => {
    setCoverImageURL(uploadedCoverImageURL);
    form.setFieldsValue({
      ...form.getFieldsValue(),
      cover_image_url: uploadedCoverImageURL,
    });
  };

  const onProfileImageUpload = (uploadedProfileImageURL = null) => {
    setProfileImageURL(uploadedProfileImageURL);
    form.setFieldsValue({
      ...form.getFieldsValue(),
      profile_image_url: uploadedProfileImageURL,
    });
  };

  const handlePublicUrlChange = async (e) => {
    if (creatorUsernameRegex.test(e.target.value)) {
      try {
        setIsLoadingUsernameCheck(true);
        const { data } = await apis.user.validUsernameCheck({
          username: e.target.value?.toLowerCase(),
        });
        if (data) {
          setIsPublicURLAvailable(true);
        } else {
          setIsPublicURLAvailable(false);
        }
        setIsLoadingUsernameCheck(false);
      } catch (error) {
        setIsLoadingUsernameCheck(false);
        message.error(error.response?.data?.message || 'Something went wrong.');
      }
    }
  };

  return (
    <>
      <Row justify="center">
        <Col xs={12} className={styles.editViewButtonContainer}>
          <button className={styles.editComponentButton} onClick={handleEditComponentClicked}>
            <EditOutlined />
          </button>
        </Col>
      </Row>
      <Modal
        title="Edit this component"
        visible={editModalVisible}
        centered={true}
        footer={null}
        width={820}
        afterClose={resetBodyStyle}
        onCancel={cancelEditChanges}
      >
        <Form form={form} layout="vertical" scrollToFirstError={true} onFinish={handleFinishEditComponent}>
          <Spin tip="Processing profile data..." size="large" spinning={isLoading}>
            <Row gutter={[8, 16]}>
              <Col xs={24}>
                <Row className={styles.imagePickers}>
                  <Col xs={24} className={styles.coverImagePickerWrapper}>
                    <Form.Item
                      name="cover_image_url"
                      id="cover_image_url"
                      className={styles.coverImageFormItem}
                      rules={validationRules.requiredValidation}
                    >
                      <ImageUpload
                        className={styles.coverImage}
                        name="cover_image_url"
                        onChange={onCoverImageUploaded}
                        value={coverImageURL}
                        label={
                          <>
                            <Text type="danger">*</Text> Cover Photo (size of Facebook Cover Image)
                          </>
                        }
                        overlayHelpText="Click to change image (size of Facebook Cover Image)"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} className={styles.profileImagePickerWrapper}>
                    <Form.Item
                      name="profile_image_url"
                      id="profile_image_url"
                      className={styles.profileImageFormItem}
                      rules={validationRules.requiredValidation}
                    >
                      <ImageUpload
                        className={styles.profileImage}
                        name="profile_image_url"
                        onChange={onProfileImageUpload}
                        value={profileImageURL}
                        aspect={1}
                        shape="round"
                        label={
                          <div className={styles.smallText}>
                            <Text type="danger">*</Text> Profile Photo
                          </div>
                        }
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
              <Col xs={24}>
                <Form.Item label="Name" required className={styles.compactFormItem}>
                  <Row gutter={10}>
                    <Col xs={12}>
                      <Form.Item name="first_name" rules={validationRules.nameValidation}>
                        <Input placeholder="First Name" />
                      </Form.Item>
                    </Col>
                    <Col xs={12}>
                      <Form.Item name="last_name" rules={validationRules.nameValidation}>
                        <Input placeholder="Last Name" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name={['profile', 'bio']} label="Your Bio">
                  <TextEditor name={['profile', 'bio']} form={form} placeholder="  Please input your bio" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="Public URL" required>
                  <Row align="middle" gutter={10}>
                    <Col>
                      <Form.Item
                        name="username"
                        className={styles.compactFormItem}
                        rules={validationRules.publicUrlValidation}
                        onBlur={handlePublicUrlChange}
                      >
                        <Input placeholder="username" />
                      </Form.Item>
                    </Col>
                    <Col>
                      <Text>.passion.do</Text>
                    </Col>
                    {isLoadingUsernameCheck ? (
                      <Col>
                        <Spin />
                      </Col>
                    ) : (
                      <Col>
                        {isPublicURLAvailable ? (
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
              </Col>

              <Col xs={24}>
                <Collapse>
                  {/* =========ONLINE PRESENCE==== */}
                  <Panel header={<Title level={5}> Your social media links (Optional)</Title>} key="web_links">
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
                </Collapse>
              </Col>

              <Col xs={24}>
                <Button block size="large" type="primary" htmlType="submit">
                  Submit
                </Button>
              </Col>
              <Col xs={24}>
                <Button block size="large" type="default" onClick={cancelEditChanges}>
                  Cancel
                </Button>
              </Col>
            </Row>
          </Spin>
        </Form>
      </Modal>
    </>
  );
};

export default CreatorProfileEditView;
