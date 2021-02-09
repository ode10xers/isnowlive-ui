import React from 'react';
import { Stream } from '@cloudflare/stream-react';

const VideoPlayer = ({ token }) => {
  if (token) {
    return (
      <div>
        <Stream src={token} autoplay muted controls />
      </div>
    );
  }
  return null;
};

export default VideoPlayer;
