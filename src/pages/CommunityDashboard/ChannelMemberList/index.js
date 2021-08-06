import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, List, Space, Button, Dropdown, Menu, Popconfirm, Tooltip, message } from 'antd';
import { UsergroupAddOutlined } from '@ant-design/icons';

import { useChatContext, useChannelStateContext, Avatar } from 'stream-chat-react';

import AddChannelMemberModal from './AddChannelMemberModal';

import { preventDefaults } from 'utils/helper';

import styles from './styles.module.scss';

// TODO: Add UI components and interactions here
// For example, show roles (owner, mods) and their respective actions
const ChannelMemberList = () => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();

  const [isLoading, setIsLoading] = useState(false);
  const [channelMembers, setChannelMembers] = useState([]);
  const [bannedFromChannelUsers, setBannedFromChannelUsers] = useState([]);

  const [channelMemberModalVisible, setChannelMemberModalVisible] = useState(false);

  const fetchChannelMembers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { members } = await channel.queryMembers({}, {}, {});

      if (members && members.length > 0) {
        setChannelMembers(members);
      } else {
        setChannelMembers([]);
      }
    } catch (error) {
      console.error(error);
      message.error('Failed to fetch member list for channel');
    }
    setIsLoading(false);
  }, [channel]);

  const fetchBannedUsersInChannel = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await client.queryBannedUsers({ channel_cid: channel.cid });
      if (result.bans.length > 0) {
        setBannedFromChannelUsers(result.bans);
      } else {
        setBannedFromChannelUsers([]);
      }
    } catch (error) {
      console.error(error);
      message.error('Failed to fetch banned user list for channel');
    }
    setIsLoading(false);
  }, [channel, client]);

  useEffect(() => {
    fetchChannelMembers();
    fetchBannedUsersInChannel();
  }, [fetchChannelMembers, fetchBannedUsersInChannel]);

  //#region Start of Flag Check Functions
  // TODO: Confirm about roles with BE here
  // See if we should change channel.state here, since it can go stale
  const isChannelAdmin = () => channel.state.membership.role === 'admin';
  const isChannelMod = (targetUser = null) =>
    targetUser
      ? channelMembers.find(
          (userData) => userData.user_id === targetUser.user_id && userData.channel_role === 'channel_moderator'
        )
      : channel.state.membership.is_moderator || channel.state.membership.role === 'channel_moderator';

  const isUserMuted = (targetUser) => client.mutedUsers.find((mutedUser) => mutedUser.target.id === targetUser.user_id);
  const isUserBanned = (targetUser) =>
    bannedFromChannelUsers.find((bannedUserData) => bannedUserData.user.id === targetUser.user_id);
  //#endregionEnd of Flag Check Functions

  //#region Start of Business Logic Functions
  const handleMuteUserInChannel = async (targetUser, durationInHours = 0) => {
    try {
      if (durationInHours) {
        await client.muteUser(targetUser.user_id, null, {
          timeout: durationInHours * 60,
        });
      } else {
        await client.muteUser(targetUser.user_id);
      }
      message.success('User have been muted!');
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to mute user');
    }
  };

  const handleUnmuteUserInChannel = async (targetUser) => {
    try {
      await client.unmuteUser(targetUser.user_id);
      message.success('User have been unmuted!');
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to unmute user');
    }
  };

  const handleBanUserFromChannel = async (targetUser, durationInHours = 0) => {
    try {
      if (durationInHours) {
        await channel.banUser(targetUser.user_id, {
          timeout: durationInHours * 60,
        });
      } else {
        await channel.banUser(targetUser.user_id);
      }
      message.success('User have been banned!');
      await fetchBannedUsersInChannel();
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to ban user');
    }
  };

  const handleUnbanUserFromChannel = async (targetUser) => {
    try {
      await channel.unbanUser(targetUser.user_id);
      message.success('User have been unbanned!');
      await fetchBannedUsersInChannel();
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to unban user');
    }
  };

  const handlePromoteUserToModerator = () => {
    // TODO: This will need API integration since
    // can only be done server-side
  };

  const handleDemoteUserFromModerator = () => {
    // TODO: This will need API integration since
    // can only be done server-side
  };

  const handleKickUserFromChannel = async (targetUser) => {
    try {
      await channel.removeMembers([targetUser.user_id]);
      message.success('User have been kicked from this channel!');
      await fetchChannelMembers();
    } catch (error) {
      console.error(error);
      message.error(error?.response?.data?.message || 'Failed to kick user');
    }
  };

  //#endregion End of Business Logic Functions

  const handleOpenChannelMemberModal = (e) => {
    preventDefaults(e);
    setChannelMemberModalVisible(true);
  };

  const handleCloseChannelMemberModal = (shouldRefresh = false) => {
    setChannelMemberModalVisible(false);

    if (shouldRefresh) {
      fetchChannelMembers();
    }
  };

  const handleRenderDropdownMenu = (onClickHandler = () => {}) => (
    <Menu onClick={onClickHandler}>
      <Menu.Item key="1">for 1 hour</Menu.Item>
      <Menu.Item key="4">for 4 hours</Menu.Item>
      <Menu.Item key="12">for 12 hours</Menu.Item>
      <Menu.Item key="24">for 24 hours</Menu.Item>
      <Menu.Item key="0">forever</Menu.Item>
    </Menu>
  );

  const listHeader = (
    <Row gutter={8}>
      <Col flex="1 1 auto">Members ({channelMembers.length})</Col>
      <Col flex="0 0 40px">
        <Tooltip title="Add members">
          <Button ghost type="primary" icon={<UsergroupAddOutlined />} onClick={handleOpenChannelMemberModal} />
        </Tooltip>
      </Col>
    </Row>
  );

  return (
    <div className={styles.p10}>
      <AddChannelMemberModal visible={channelMemberModalVisible} closeModal={handleCloseChannelMemberModal} />
      <List
        itemLayout="vertical"
        split={false}
        loading={{
          spinning: isLoading,
          tip: 'Loading members',
        }}
        rowKey={(member) => member.user_id}
        header={listHeader}
        dataSource={channelMembers}
        renderItem={(member) => (
          <List.Item>
            <List.Item.Meta
              className={styles.channelMemberItems}
              avatar={<Avatar name={member.user.name} shape="circle" size={32} />}
              title={member.user.name}
            />
            {member.user_id !== client.userID && (
              <Space size="small" align="middle">
                {isUserMuted(member) ? (
                  <Button size="small" type="link" onClick={() => handleUnmuteUserInChannel(member)}>
                    Unmute
                  </Button>
                ) : (
                  <Dropdown
                    trigger="click"
                    overlay={handleRenderDropdownMenu(({ key }) => handleMuteUserInChannel(member, parseInt(key)))}
                  >
                    <Button size="small" type="link">
                      Mute
                    </Button>
                  </Dropdown>
                )}
                {isChannelAdmin() || isChannelMod() ? (
                  isUserBanned(member) ? (
                    <Button size="small" type="link" onClick={() => handleUnbanUserFromChannel(member)}>
                      Unban
                    </Button>
                  ) : (
                    <Dropdown
                      trigger="click"
                      overlay={handleRenderDropdownMenu(({ key }) => handleBanUserFromChannel(member, parseInt(key)))}
                    >
                      <Button size="small" type="link">
                        Ban
                      </Button>
                    </Dropdown>
                  )
                ) : null}
                {isChannelAdmin() ? (
                  isChannelMod(member) ? (
                    <Button size="small" type="link" onClick={() => handleDemoteUserFromModerator(member)}>
                      Demote
                    </Button>
                  ) : (
                    <Button size="small" type="link" onClick={() => handlePromoteUserToModerator(member)}>
                      Promote
                    </Button>
                  )
                ) : null}
                {isChannelAdmin() || isChannelMod() ? (
                  <Popconfirm
                    title="Are you sure you want to kick this user?"
                    okType="danger"
                    onConfirm={() => handleKickUserFromChannel(member)}
                  >
                    <Button size="small" type="link">
                      Kick
                    </Button>
                  </Popconfirm>
                ) : null}
              </Space>
            )}
          </List.Item>
        )}
      />
    </div>
  );
};

export default ChannelMemberList;
