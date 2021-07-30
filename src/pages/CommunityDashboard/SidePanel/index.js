import React from 'react';
import { useHistory } from 'react-router-dom';

import { ChannelList, useChatContext } from 'stream-chat-react';

import { Space, Typography } from 'antd';

import Routes from 'routes';

const { Title, Text } = Typography;

const SidePanel = () => {
  const history = useHistory();
  const { channel: activeChannel } = useChatContext();

  console.log(`Active Channel`);
  console.log(activeChannel);

  return (
    <ChannelList
      EmptyStateIndicator={(emptyStateProps) => <Text disabled> You currently have no active channels </Text>}
      List={(listProps) => {
        return (
          <Space direction="vertical">
            <Title level={5}> Curriculum </Title>
            <div>
              <Title level={5}> Channels </Title>
              <div style={{ paddingLeft: 20 }}>{listProps.children}</div>
            </div>
          </Space>
        );
      }}
      Preview={(previewProps) => {
        return (
          <div
            onClick={() => {
              history.push(Routes.community.root + Routes.community.chatChannels);
              previewProps.setActiveChannel(previewProps.channel);
            }}
          >
            {' '}
            <Text> {`# ${previewProps.channel?.data?.name ?? 'DMs'}`} </Text>{' '}
          </div>
        );
      }}
    />
  );
};

export default SidePanel;
