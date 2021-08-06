import React, { useState, useCallback, useEffect } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { useChatContext } from 'stream-chat-react';

import { Modal, Form, Button, Select, Input, Row, Col } from 'antd';

import apis from 'apis';
import Routes from 'routes';

import Loader from 'components/Loader';
import { resetBodyStyle, showErrorModal, showSuccessModal } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { isAPISuccess } from 'utils/helper';

import { formLayout } from 'layouts/FormLayouts';

// TODO: Implement Edit Channel flow
// In this case, the edit can only be used to edit the name
// Adding/removing channel members require different method and is handled differently
const NewChannelModal = ({ visible, closeModal, type = 'team' }) => {
  const history = useHistory();
  const match = useRouteMatch();
  const [form] = Form.useForm();

  const { client, setActiveChannel } = useChatContext();

  const [isLoading, setIsLoading] = useState(false);
  const [availableMembers, setAvailableMembers] = useState([]);

  const fetchAvailableMembers = useCallback(async (courseExternalId) => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.courses.getCreatorCourseDetailsById(courseExternalId);

      if (isAPISuccess(status) && data) {
        setAvailableMembers(data.buyers);
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed fetching available members', error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (visible) {
      fetchAvailableMembers(match.params.course_id);
      form.resetFields();
    } else {
      setAvailableMembers([]);
    }
  }, [form, visible, match, fetchAvailableMembers]);

  const handleFormFinish = async (values) => {
    setIsLoading(true);
    try {
      let newChannel = null;

      if (type === 'messaging') {
        const privateMessageToAttendeeMembers = [client.userID, values.channelMembers];

        const existingChannel = await client.queryChannels({
          type: 'messaging',
          members: { $eq: privateMessageToAttendeeMembers },
        });

        if (existingChannel.length > 0) {
          newChannel = existingChannel[0];
        } else {
          newChannel = await client.channel('messaging', {
            members: [client.userID, values.channelMembers],
          });
          await newChannel.watch();
        }
      } else {
        // NOTE: We'll need to specify the channel id here,
        // Stream by default generates an ID based on specified members
        // and that might block us from creating 2 different channels with the same members
        // In order to do that we'll need to specify the ID
        newChannel = await client.channel('team', {
          name: values.channelName ?? 'Channel Name',
          members: [client.userID, ...values.channelMembers],
        });
        await newChannel.watch();
      }

      if (newChannel) {
        history.push(
          `/community/${match.params.course_id}${
            type === 'messaging' ? Routes.community.chatChannels : Routes.community.feeds
          }`
        );
        setActiveChannel(newChannel);
      }

      showSuccessModal('Successfully created chat channel!');
      closeModal();
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to create chat channel', error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  };

  return (
    <Modal
      width={640}
      footer={null}
      centered={true}
      closable={true}
      maskClosable={false}
      visible={visible}
      onCancel={closeModal}
      title="Create new chat"
      afterClose={resetBodyStyle}
    >
      <Loader size="large" loading={isLoading}>
        <Form scrollToFirstError form={form} onFinish={handleFormFinish}>
          <Row>
            <Col xs={type === 'messaging' ? 0 : 24}>
              <Form.Item
                {...formLayout}
                id="channelName"
                name="channelName"
                label="Channel Name"
                rules={type === 'messaging' ? [] : validationRules.requiredValidation}
              >
                <Input placeholder="Input channel name here" maxLength={25} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                {...formLayout}
                id="channelMembers"
                name="channelMembers"
                label={type === 'messaging' ? 'Attendee' : 'Channel Members'}
                rules={type === 'messaging' ? validationRules.requiredValidation : validationRules.arrayValidation}
              >
                <Select
                  allowClear
                  placeholder="Select channel members"
                  mode={type === 'messaging' ? undefined : 'multiple'}
                  options={availableMembers.map((member) => ({
                    label: member.name,
                    value: member.external_id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Row justify="end">
                <Col>
                  <Button type="primary" htmlType="submit" loading={isLoading}>
                    {type === 'messaging' ? 'Chat with attendee' : 'Create Chat Channel'}
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        </Form>
      </Loader>
    </Modal>
  );
};

export default NewChannelModal;
