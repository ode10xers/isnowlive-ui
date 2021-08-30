import React, { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router';
import classNames from 'classnames';
import { Form, Typography, Button, Row, Col, Input, message, Spin } from 'antd';

import Routes from 'routes';
import apis from 'apis';

import Loader from 'components/Loader';

import validationRules from 'utils/validation';
import { isAPISuccess } from 'utils/helper';
import { getLocalUserDetails } from 'utils/storage';
import { isMobileDevice } from 'utils/device';

import { mixPanelEventTags, trackSuccessEvent, trackFailedEvent } from 'services/integrations/mixpanel';
import { gtmTriggerEvents, customNullValue, pushToDataLayer } from 'services/integrations/googleTagManager';
import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const { Text } = Typography;
const { creator } = mixPanelEventTags;

// TODO: This page still have some old logic (need to cleanup)
// The old logic is related to dashboard checking, etc
const Profile = () => {
  const history = useHistory();
  const { setUserDetails } = useGlobalContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsernameCheck, setIsLoadingUsernameCheck] = useState(false);
  const [isPublicUrlAvailable, setIsPublicUrlAvailable] = useState(false);
  const [form] = Form.useForm();

  const getProfileDetails = useCallback(async () => {
    try {
      const { status, data } = await apis.user.getProfile();
      if (isAPISuccess(status) && data) {
        const localUserDetails = getLocalUserDetails();
        if (!localUserDetails.profile_complete) {
          data.username = '';
        }
        form.setFieldsValue(data);
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      message.error(error.response?.data?.message || 'Something went wrong.');
      setIsLoading(false);
    }
  }, [form]);

  // Also adjust the event tags when necessary
  const updateProfileDetails = async (values) => {
    const eventTag = creator.click.profile.editForm.submitProfile;

    try {
      let localUserDetails = getLocalUserDetails();

      if (!localUserDetails.is_creator) {
        await apis.user.convertUserToCreator();
      }

      const payload = {
        ...values,
        profile: {
          category: 'YOGA',
        },
      };

      // TODO: Right now, the category is hard coded to YOGA
      // Later we'll need to make a dropdown of choices
      const { status, data } = await apis.user.updateProfile(payload);
      if (isAPISuccess(status) && data) {
        setIsLoading(false);
        trackSuccessEvent(eventTag, { form_values: payload });
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
        setUserDetails(data);
        history.push(Routes.onboardingProfile);
      }
    } catch (error) {
      setIsLoading(false);
      trackFailedEvent(eventTag, error, { form_values: values });
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  };

  useEffect(() => {
    getProfileDetails();
  }, [getProfileDetails]);

  const onFinish = (values) => {
    setIsLoading(true);

    if (isPublicUrlAvailable) {
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
          setIsPublicUrlAvailable(true);
        } else {
          setIsPublicUrlAvailable(false);
        }
        setIsLoadingUsernameCheck(false);
      } catch (error) {
        setIsLoadingUsernameCheck(false);
        message.error(error.response?.data?.message || 'Something went wrong.');
      }
    }
  };

  return (
    <div className={styles.onboardingPage}>
      <Loader loading={isLoading} size="large" text="Loading profile">
        <div className={styles.formContainer}>
          <div className={styles.formHeadingText}>Name your Site</div>
          <div className={styles.formHeadingSubtext}>Set a public URL for your website</div>
          <div className={styles.formContent}>
            <Form
              form={form}
              onFinish={onFinish}
              labelAlign={isMobileDevice ? 'left' : 'right'}
              scrollToFirstError={true}
            >
              <Form.Item className={styles.nameInputWrapper}>
                <Form.Item className={styles.nameInput} name="first_name" rules={validationRules.nameValidation}>
                  <Input placeholder="First Name" />
                </Form.Item>
                <Form.Item className={styles.nameInput} name="last_name" rules={validationRules.nameValidation}>
                  <Input placeholder="Last Name" />
                </Form.Item>
              </Form.Item>

              <Form.Item>
                <Row align="middle" gutter={[10, 10]} className={styles.alignUrl}>
                  <Col flex="0 0 120px">
                    <Form.Item
                      name="username"
                      rules={validationRules.publicUrlValidation}
                      onBlur={handlePublicUrlChange}
                    >
                      <Input placeholder="Username" maxLength={30} />
                    </Form.Item>
                  </Col>
                  <Col flex="0 0 70px">
                    <Text>.passion.do</Text>
                  </Col>

                  <Col flex="1 1 auto">
                    {isLoadingUsernameCheck ? (
                      <Spin />
                    ) : (
                      <Text type={isPublicUrlAvailable ? 'success' : 'danger'}>
                        <span
                          className={classNames(styles.dot, isPublicUrlAvailable ? styles.success : styles.danger)}
                        ></span>{' '}
                        {isPublicUrlAvailable ? 'Available' : 'Unavailable'}
                      </Text>
                    )}
                  </Col>
                </Row>
              </Form.Item>

              <Form.Item>
                <Button
                  disabled={!isPublicUrlAvailable}
                  className={styles.submitButton}
                  htmlType="submit"
                  type="primary"
                >
                  Continue
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </Loader>
    </div>
  );
};

export default Profile;
