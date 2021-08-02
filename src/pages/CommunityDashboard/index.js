import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Switch, Route } from 'react-router-dom';

import { StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';

import { Layout, Spin } from 'antd';

import apis from 'apis';
import Routes from 'routes';

import SidePanel from './SidePanel';
import ChatWindow from './ChatWindow';
import { showErrorModal } from 'components/Modals/modals';

import { isAPISuccess } from 'utils/helper';

import { useGlobalContext } from 'services/globalContext';

import 'stream-chat-react/dist/css/index.css';

const { Content, Sider } = Layout;

// TODO: Remove this hardcoded data later

// ellianto+1001@10xers.co
const attendeeUser1 = {
  data: {
    id: 'a42c0fe1-1b9d-43b6-9ac1-5dab7c50ca72',
    name: 'Attendee Me 1',
    role: 'user',
  },
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYTQyYzBmZTEtMWI5ZC00M2I2LTlhYzEtNWRhYjdjNTBjYTcyIn0.UMDMDM4EgSEDymg7yylejEf2NE-i7MYpoeSZqIKChMQ',
};

// ellianto+1003@10xers.co
const attendeeUser2 = {
  data: {
    id: 'da40d9fc-c1e6-4a24-8a40-3049aa9b08f7',
    name: 'Attendee Elli 2',
    role: 'user',
  },
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZGE0MGQ5ZmMtYzFlNi00YTI0LThhNDAtMzA0OWFhOWIwOGY3In0.RDI8CJqUVZrlYFDMEwzbLSE5L4bdtkWJP5b5v1qfs10',
};

// ellianto+101@10xers.co
const creatorUser = {
  data: {
    id: '852e2683-8291-4398-ad5e-16d01f85ec20',
    name: 'Creator Elli',
    role: 'admin',
  },
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiODUyZTI2ODMtODI5MS00Mzk4LWFkNWUtMTZkMDFmODVlYzIwIn0.IQA0KWts_k6UWkENV1jz7erAzZUIquovIiPTVaaGxSw',
};

const mockUsers = [attendeeUser1, attendeeUser2, creatorUser];

const chatClient = StreamChat.getInstance('9kapp3pjzvmg');

// NOTE : We manage the layouting here since Chat needs the client to be instantiated
const CommunityDashboard = ({ match, history }) => {
  const {
    state: { userDetails },
  } = useGlobalContext();

  const [clientReady, setClientReady] = useState(false);
  const [courseDetails, setCourseDetails] = useState(null);

  const fetchCourseDetails = useCallback(async (courseExternalId) => {
    try {
      const { status, data } = await apis.courses.getDetails(courseExternalId);

      if (isAPISuccess(status) && data) {
        setCourseDetails(data);
      }
    } catch (error) {
      console.error(error);
      showErrorModal('Failed to fetch course details!', error?.response?.data?.message || 'Something went wrong.');
    }
  }, []);

  const isCourseOwner = useMemo(() => {
    if (!courseDetails) {
      return false;
    }

    if (!userDetails?.is_creator || !userDetails?.username) {
      return false;
    }

    return courseDetails.creator_username === userDetails?.username;
  }, [courseDetails, userDetails]);

  useEffect(() => {
    const setupClient = async (userData) => {
      try {
        await chatClient.connectUser(userData.data, userData.token);
        setClientReady(true);
      } catch (err) {
        console.log(err);
      }
    };

    const user = mockUsers.find((mockUser) => mockUser.data.id === userDetails.external_id) ?? mockUsers[0];

    if (user) {
      setupClient(user);
    } else {
      setClientReady(false);
    }
  }, [userDetails]);

  useEffect(() => {
    if (match.params.course_id) {
      fetchCourseDetails(match.params.course_id);
    } else {
      history.push(userDetails?.is_creator ? Routes.creatorDashboard.rootPath : Routes.attendeeDashboard.rootPath);
    }
    // eslint-disable-next-line
  }, [match.params, history, fetchCourseDetails]);

  if (!clientReady || !courseDetails) {
    return (
      <Spin spinning={true}>
        <div style={{ width: '100%', minHeight: 400 }} />
      </Spin>
    );
  }

  // TODO: Might want to move these later to creator dashboard index.js
  // This is so that they can see whenever there are new messages
  return (
    <Chat client={chatClient}>
      <Layout>
        <Sider>
          <SidePanel isCourseOwner={isCourseOwner} creatorUsername={courseDetails?.creator_username} />
        </Sider>
        <Content>
          <Switch>
            <Route exact path={match.url + Routes.community.chatChannels} component={ChatWindow} />
          </Switch>
        </Content>
      </Layout>
    </Chat>
  );
};

export default CommunityDashboard;
