import React from 'react';
import classNames from 'classnames';
import { useHistory, useLocation } from 'react-router-dom';

import { ChannelList, useChatContext } from 'stream-chat-react';

import { Space, Typography } from 'antd';

import Routes from 'routes';

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

const ChannelListItem = ({ channel, setActiveChannel }) => {
  const history = useHistory();
  const location = useLocation();

  const { channel: activeChannel } = useChatContext();

  return (
    <div
      className={classNames(
        styles.channelListItem,
        location.pathname.match(Routes.community.root + Routes.community.chatChannels) &&
          activeChannel &&
          channel.data?.id === activeChannel?.data?.id
          ? styles.activeChannel
          : undefined
      )}
      onClick={() => {
        history.push(Routes.community.root + Routes.community.chatChannels);
        setActiveChannel(channel);
      }}
    >
      {`# ${channel?.data?.name ?? 'DMs'}`}
    </div>
  );
};

const SidePanel = () => {
  return (
    <Space direction="vertical" className={styles.sidePanelContainer}>
      <div className={styles.navItem}>
        <Title level={5}> Curriculum </Title>
      </div>
      <div className={styles.channelListContainer}>
        <ChannelList
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
    </Space>
  );
};

export default SidePanel;
