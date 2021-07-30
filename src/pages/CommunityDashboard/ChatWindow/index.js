import React from 'react';

import { Channel, ChannelHeader, MessageList, MessageInput, Thread, Window } from 'stream-chat-react';

const ChatWindow = () => {
  return (
    <div>
      <Channel>
        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageInput />
        </Window>
        <Thread />
      </Channel>
    </div>
  );
};

export default ChatWindow;
