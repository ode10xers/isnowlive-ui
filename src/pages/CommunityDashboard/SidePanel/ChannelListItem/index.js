import React from 'react';
import classNames from 'classnames';
import { useHistory, useLocation, useRouteMatch } from 'react-router-dom';

import { Typography } from 'antd';

import { useChatContext, Avatar } from 'stream-chat-react';

import Routes from 'routes';

import styles from './styles.module.scss';

const { Text, Paragraph } = Typography;

const ChannelListItem = ({ channel, setActiveChannel, onChannelItemClicked = () => {} }) => {
  const history = useHistory();
  const location = useLocation();
  const match = useRouteMatch();

  const { channel: activeChannel, client } = useChatContext();

  const renderMessagingChannelPreview = () => {
    const otherChannelMembers = Object.values(channel.state.members).filter(({ user }) => user.id !== client.userID);

    if (otherChannelMembers.length === 1) {
      //  Direct/Private 1-on-1 chat
      return (
        <div className={styles.messagingPreviewContainer}>
          <Avatar name={otherChannelMembers[0].user.name || otherChannelMembers[0].user.id} shape="circle" size={24} />
          <Text className={styles.whiteText}>
            {' '}
            {otherChannelMembers[0].user.name || otherChannelMembers[0].user.id}{' '}
          </Text>
        </div>
      );
    } else {
      // Group Chat
      return (
        <div className={styles.messagingPreviewContainer}>
          <div className={styles.avatarsContainer}>
            <Avatar
              className={styles.firstAvatar}
              name={otherChannelMembers[0].user.name || otherChannelMembers[0].user.id}
              shape="circle"
              size={24}
            />
            <Avatar
              className={styles.avatar}
              name={otherChannelMembers[1].user.name || otherChannelMembers[1].user.id}
              shape="circle"
              size={24}
            />
          </div>
          <Paragraph className={styles.whiteText}>
            {otherChannelMembers[0].user.name || otherChannelMembers[0].user.id},{' '}
            {otherChannelMembers[1].user.name || otherChannelMembers[1].user.id}{' '}
            {otherChannelMembers.length > 2 ? `, and ${otherChannelMembers.length - 2} more...` : ''}
          </Paragraph>
        </div>
      );
    }
  };

  return (
    <div
      className={classNames(
        styles.channelListItem,
        (location.pathname.includes(Routes.community.chatChannels) ||
          location.pathname.includes(Routes.community.feeds)) &&
          activeChannel &&
          channel.data?.id === activeChannel?.data?.id
          ? styles.activeChannel
          : undefined
      )}
      onClick={() => {
        history.push(
          `/community/${match.params.course_id}${
            channel.type === 'team' ? Routes.community.feeds : Routes.community.chatChannels
          }`
        );
        onChannelItemClicked();
        setActiveChannel(channel);
      }}
    >
      {channel.type === 'team' ? `# ${channel?.data?.name ?? 'Text Channel'}` : renderMessagingChannelPreview()}
    </div>
  );
};

export default ChannelListItem;
