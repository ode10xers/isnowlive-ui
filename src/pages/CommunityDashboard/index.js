import React, { useState, useEffect } from 'react';
import { Switch, Route } from 'react-router-dom';

import { StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';

import { Layout, Spin } from 'antd';

import Routes from 'routes';

import SidePanel from './SidePanel';
import ChatWindow from './ChatWindow';

import 'stream-chat-react/dist/css/index.css';

const { Content, Sider } = Layout;

// TODO: Remove this hardcoded data later

const attendeeUser1 = {
  data: {
    id: 'Ellianto_bc9429f8-b18d-4779-a73f-4eb7611ac744',
    name: 'Ellianto',
    role: 'user',
  },
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiRWxsaWFudG9fYmM5NDI5ZjgtYjE4ZC00Nzc5LWE3M2YtNGViNzYxMWFjNzQ0In0.eXcuizQ_EdpUHB9NwnMZh8rEZRa293fZJTaYProNcFo',
};

const attendeeUser2 = {
  data: {
    id: 'Pranjal_d9e49361-e2e2-45b2-997e-1c05401b6c84',
    name: 'Pranjal',
    role: 'user',
  },
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiUHJhbmphbF9kOWU0OTM2MS1lMmUyLTQ1YjItOTk3ZS0xYzA1NDAxYjZjODQifQ.eitG3OdXzT8rZGR3kCeqU1dQC8UHmyRo6K-rbAuQWVE',
};

const creatorUser = {
  data: {
    id: 'Rahul_6666bd0b-afe1-4c37-9d73-ad55cbc9f3af',
    name: 'Rahul',
    role: 'admin',
  },
  token:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiUmFodWxfNjY2NmJkMGItYWZlMS00YzM3LTlkNzMtYWQ1NWNiYzlmM2FmIn0.tg5llG5o10Gs8Ms8lyVNS7OlOsQLJuVEDV2-6bz9xws',
};

const chatClient = StreamChat.getInstance('9kapp3pjzvmg');

// NOTE : We manage the layouting here since Chat needs the client to be instantiated
const CommunityDashboard = ({ match, history }) => {
  const [clientReady, setClientReady] = useState(false);
  const user = creatorUser;

  useEffect(() => {
    const setupClient = async (userData) => {
      try {
        await chatClient.connectUser(userData.data, userData.token);

        setClientReady(true);
      } catch (err) {
        console.log(err);
      }
    };

    if (user) {
      setupClient(user);
    } else {
      setClientReady(false);
    }
  }, [user]);

  if (!clientReady) {
    return (
      <Spin spinning={true} tip="Connecting to Stream Chat">
        <div style={{ width: '100%', minHeight: 400 }} />
      </Spin>
    );
  }

  return (
    <Chat client={chatClient}>
      <Layout>
        <Sider>
          <SidePanel />
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
