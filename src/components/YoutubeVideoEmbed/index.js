import React from 'react';

export const YoutubeVideoEmbed = ({ videoId = null }) =>
  videoId ? (
    <iframe
      width="100%"
      height="100%"
      style={{ aspectRatio: '16 / 9' }}
      src={`https://www.youtube.com/embed/${videoId}`}
      title="YouTube video player"
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen
    ></iframe>
  ) : null;

export default YoutubeVideoEmbed;
