import React, { useState, useCallback, useEffect } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { Modal, Row, Col, Button, Select, Typography, Spin, message } from 'antd';

import { useChannelStateContext } from 'stream-chat-react';

import apis from 'apis';

import { resetBodyStyle, showErrorModal } from 'components/Modals/modals';

import { isAPISuccess, preventDefaults } from 'utils/helper';

import styles from './styles.module.scss';

const { Text } = Typography;

const AddChannelMemberModal = ({ visible, closeModal = () => {} }) => {
  const match = useRouteMatch();

  const { channel } = useChannelStateContext();

  const [isLoading, setIsLoading] = useState(false);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const fetchAvailableMembers = useCallback(
    async (courseExternalId) => {
      setIsLoading(true);

      try {
        const { status, data } = await apis.courses.getCreatorCourseDetailsById(courseExternalId);

        if (isAPISuccess(status) && data) {
          const existingChannelMembers = Object.keys(channel.state.members);
          setAvailableMembers(data.buyers.filter((buyer) => !existingChannelMembers.includes(buyer.external_id)));
        }
      } catch (error) {
        console.error(error);
        showErrorModal('Failed fetching available members', error?.response?.data?.message || 'Something went wrong.');
      }

      setIsLoading(false);
    },
    [channel]
  );

  useEffect(() => {
    if (visible) {
      console.log(match);
      fetchAvailableMembers(match.params.course_id);
    } else {
      setAvailableMembers([]);
    }
  }, [visible, match, fetchAvailableMembers]);

  const handleAddNewMembersClicked = async (e) => {
    preventDefaults(e);

    if (selectedMembers.length) {
      try {
        await channel.addMembers(selectedMembers);
        message.success('New members added to channel!');
        closeModal(true);
      } catch (error) {
        console.error(error);
        message.error('Failed to add new member to channel!');
      }
    } else {
      message.error('Please select at least 1 member');
    }
  };

  return (
    <Modal
      closable={true}
      centered={true}
      visible={visible}
      onCancel={() => closeModal(false)}
      afterClose={resetBodyStyle}
      footer={null}
      title="Add channel members"
    >
      <Spin spinning={isLoading} tip="Processing..." size="large">
        <Row gutter={[8, 12]} align="middle">
          <Col xs={24} lg={10} className={styles.labelHelpText}>
            <Text> New Channel Members: </Text>
          </Col>
          <Col xs={24} lg={14}>
            <Select
              className={styles.memberSelectDropdown}
              allowClear
              mode="multiple"
              placeholder="Select new channel members"
              value={selectedMembers}
              onChange={setSelectedMembers}
              options={availableMembers.map((member) => ({
                label: member.name,
                value: member.external_id,
              }))}
            />
          </Col>
          <Col xs={24}>
            <Row justify="end">
              <Col>
                <Button type="primary" onClick={handleAddNewMembersClicked}>
                  Add Members
                </Button>
              </Col>
            </Row>
          </Col>
        </Row>
      </Spin>
    </Modal>
  );
};

export default AddChannelMemberModal;
