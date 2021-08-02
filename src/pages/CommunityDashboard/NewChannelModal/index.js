import React, { useState, useCallback, useEffect } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { useChatContext } from 'stream-chat-react';

import { Modal, Form, Button, Select, Input, Row, Col } from 'antd';

import Loader from 'components/Loader';
import { resetBodyStyle, showErrorModal } from 'components/Modals/modals';

import validationRules from 'utils/validation';
import { isAPISuccess } from 'utils/helper';

import { formLayout } from 'layouts/FormLayouts';

const mockUserData = [
  {
    id: 'da40d9fc-c1e6-4a24-8a40-3049aa9b08f7',
    name: 'Attendee Elli 2',
    role: 'user',
  },
  {
    id: 'a42c0fe1-1b9d-43b6-9ac1-5dab7c50ca72',
    name: 'Attendee Me 1',
    role: 'user',
  },
];

// TODO: Implement Edit Channel flow
const NewChannelModal = ({ visible, closeModal, type = 'team' }) => {
  const history = useHistory();
  const match = useRouteMatch();
  const [form] = Form.useForm();

  const { client, setActiveChannel } = useChatContext();

  const [isLoading, setIsLoading] = useState(false);
  const [availableMembers, setAvailableMembers] = useState([]);

  const fetchAvailableMembers = useCallback(() => {
    setIsLoading(true);
    try {
      const { status, data } = {
        status: 200,
        data: mockUserData,
      };

      if (isAPISuccess(status) && data) {
        setAvailableMembers(data);
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed fetching available members', error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);

    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (visible) {
      fetchAvailableMembers();
    } else {
      setAvailableMembers([]);
    }
  }, [visible, fetchAvailableMembers]);

  const handleFormFinish = async (values) => {
    setIsLoading(true);
    try {
      let newChannel = null;

      if (type === 'messaging') {
        newChannel = await client.channel('messaging', {
          members: [client.userID, values.channelMembers],
        });
      } else {
        newChannel = await client.channel('team', {
          name: values.channelName ?? 'Channel Name',
          members: [client.userID, ...values.channelMembers],
        });
      }

      if (newChannel) {
        await newChannel.watch();
        history.push(`/community/${match.params.course_id}/channels`);
        setActiveChannel(newChannel);
      }

      closeModal();
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to create chat channel', error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  };

  // TODO: Need to show list of buyers/team members here
  // TODO: Filter the members if the single chat message already exists
  return (
    <Modal
      width={640}
      footer={null}
      centered={true}
      closable={true}
      visible={visible}
      onClose={closeModal}
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
                    value: member.id,
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
