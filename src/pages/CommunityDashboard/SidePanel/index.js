import React, { useState, useEffect, useCallback } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { ChannelList, useChatContext } from 'stream-chat-react';

import { Space, Typography, Button, Spin } from 'antd';
import { ArrowLeftOutlined, LoadingOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import ChannelListItem from '../ChannelListItem';

import { isAPISuccess, preventDefaults } from 'utils/helper';

import styles from './styles.module.scss';
import { showErrorModal } from 'components/Modals/modals';

const { Title } = Typography;

const ChannelListTemplate = ({ children, loading, LoadingIndicator, listTitle = 'Channels' }) => {
  // TODO: Can also add LoadingErrorIndicator for failed loadings

  return (
    <div>
      <Title level={5} className={styles.pl10}>
        {listTitle}
      </Title>
      {loading ? (
        <div className={styles.textAlignCenter}>
          <LoadingIndicator loadingText={`Getting ${listTitle.toLowerCase()} info`} />
        </div>
      ) : (
        children && <div className={styles.subMenuContainer}>{children}</div>
      )}
    </div>
  );
};

const ChannelListLoadingIndicator = ({ loadingText = 'Getting channel info' }) => (
  <Spin
    className={styles.whiteText}
    spinning={true}
    indicator={<LoadingOutlined spin className={styles.whiteText} />}
    tip={loadingText}
  />
);

const SidePanel = ({ isCourseOwner = false, creatorUsername = null }) => {
  const history = useHistory();
  const match = useRouteMatch();

  const { client, setActiveChannel } = useChatContext();

  const [isLoading, setIsLoading] = useState(false);
  const [creatorDetails, setCreatorDetails] = useState(null);

  const teamChannelFilter = (channels) =>
    channels.filter(
      (channel) => channel.type === 'team' && Object.keys(channel.state?.members).includes(client.userID)
    );
  const messagingChannelFilter = (channels) =>
    channels.filter(
      (channel) => channel.type === 'messaging' && Object.keys(channel.state?.members).includes(client.userID)
    );

  const userIncludedChannelsFilter = { members: { $in: [client.userID] } };

  const fetchCreatorDetailsByUsername = useCallback(async (username) => {
    setIsLoading(true);
    try {
      const { status, data } = await apis.user.getProfileByUsername(username);

      if (isAPISuccess(status) && data) {
        setCreatorDetails(data);
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to fetch creator details', error?.response?.data?.message || 'Something went wrong.');
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (creatorUsername) {
      fetchCreatorDetailsByUsername(creatorUsername);
    }
  }, [creatorUsername, fetchCreatorDetailsByUsername]);

  const redirectToDashboard = (e) => {
    preventDefaults(e);
    history.push(isCourseOwner ? Routes.creatorDashboard.rootPath : Routes.attendeeDashboard.rootPath);
  };

  const handleCreateNewChannel = (e) => {
    preventDefaults(e);

    // TODO: Need to show list of buyers/team members here
  };

  const handleInitiateChatWithAttendee = (e) => {
    preventDefaults(e);
    // TODO: Need to show list of buyers/team members here
  };

  const handleInitiateChatWithCreator = async (e) => {
    preventDefaults(e);

    if (creatorDetails) {
      // NOTE : This filter is assuming that user external_id is being used
      // as Stream Chat user ID
      const privateMessageToCreatorMembers = [client.userID, creatorDetails.external_id];

      const existingChannels = await client.queryChannels({
        type: 'messaging',
        members: { $eq: privateMessageToCreatorMembers },
      });

      if (existingChannels.length > 0) {
        setActiveChannel(existingChannels[0]);
      } else {
        setIsLoading(true);
        const newChannel = await client.channel('messaging', {
          members: privateMessageToCreatorMembers,
        });

        // Will create if doesn't exists and watch the channel
        await newChannel.watch();
        history.push(`/community/${match.params.course_id}/channels`);
        setActiveChannel(newChannel);
        setIsLoading(false);
      }
    }
  };

  return (
    <Spin spinning={isLoading} size="large">
      <Space direction="vertical" className={styles.sidePanelContainer}>
        <div className={styles.navItem}>
          <Button
            block
            type="link"
            className={styles.whiteText}
            icon={<ArrowLeftOutlined />}
            onClick={redirectToDashboard}
          >
            Back to Dashboard
          </Button>
        </div>
        {isCourseOwner ? (
          <div className={styles.navItem}>
            <Button block type="primary" className={styles.greenBtn} onClick={handleCreateNewChannel}>
              Create new channel
            </Button>
          </div>
        ) : null}
        {isCourseOwner ? (
          <div className={styles.navItem}>
            <Button
              block
              ghost
              type="primary"
              className={styles.whiteOutlineButton}
              onClick={handleInitiateChatWithAttendee}
            >
              Chat with Attendee
            </Button>
          </div>
        ) : null}
        {!isCourseOwner ? (
          <div className={styles.navItem}>
            <Button
              block
              ghost
              type="primary"
              className={styles.whiteOutlineButton}
              onClick={handleInitiateChatWithCreator}
            >
              Chat with Creator
            </Button>
          </div>
        ) : null}
        <div className={styles.channelListContainer}>
          <ChannelList
            channelRenderFilterFn={teamChannelFilter}
            filter={userIncludedChannelsFilter}
            EmptyStateIndicator={(emptyStateProps) => {
              return (
                <Title level={5} className={styles.emptyChannelText}>
                  You have no active channels
                </Title>
              );
            }}
            LoadingIndicator={ChannelListLoadingIndicator}
            List={(listProps) => <ChannelListTemplate {...listProps} listTitle="Channels" />}
            Preview={ChannelListItem}
          />
        </div>
        <div className={styles.channelListContainer}>
          <ChannelList
            channelRenderFilterFn={messagingChannelFilter}
            filter={userIncludedChannelsFilter}
            LoadingIndicator={ChannelListLoadingIndicator}
            EmptyStateIndicator={(emptyStateProps) => {
              return (
                <Title level={5} className={styles.emptyChannelText}>
                  You have no messages
                </Title>
              );
            }}
            List={(listProps) => <ChannelListTemplate {...listProps} listTitle="Messages" />}
            Preview={ChannelListItem}
          />
        </div>
      </Space>
    </Spin>
  );
};

export default SidePanel;
