import React from 'react';

import { ChannelList } from 'stream-chat-react';

import { Space, Typography } from 'antd';

import ChannelListItem from '../ChannelListItem';

import styles from './styles.module.scss';

const { Title, Text } = Typography;

const ChannelListTemplate = ({ listTitle = 'Channels', listElement = null }) => (
  <div>
    <Title level={5} className={styles.pl10}>
      {' '}
      {listTitle}{' '}
    </Title>
    {listElement && <div className={styles.subMenuContainer}>{listElement}</div>}
  </div>
);

const SidePanel = () => {
  const teamChannelFilter = (channels) => channels.filter((channel) => channel.type === 'team');
  const messagingChannelFilter = (channels) => channels.filter((channel) => channel.type === 'messaging');

  return (
    <Space direction="vertical" className={styles.sidePanelContainer}>
      <div className={styles.navItem}>
        <Title level={5}> Curriculum </Title>
      </div>
      <div className={styles.channelListContainer}>
        <ChannelList
          channelRenderFilterFn={teamChannelFilter}
          EmptyStateIndicator={(emptyStateProps) => {
            return (
              <Text disabled className={styles.pl20}>
                {' '}
                You currently have no active channels{' '}
              </Text>
            );
          }}
          List={(listProps) => {
            return <ChannelListTemplate listElement={listProps.children} listTitle="Channels" />;
          }}
          Preview={ChannelListItem}
        />
      </div>
      <div className={styles.channelListContainer}>
        <ChannelList
          channelRenderFilterFn={messagingChannelFilter}
          EmptyStateIndicator={(emptyStateProps) => {
            return (
              <Text disabled className={styles.pl20}>
                You currently have no messages
              </Text>
            );
          }}
          List={(listProps) => {
            return <ChannelListTemplate listElement={listProps.children} listTitle="Messages" />;
          }}
          Preview={ChannelListItem}
        />
      </div>
    </Space>
  );
};

export default SidePanel;
