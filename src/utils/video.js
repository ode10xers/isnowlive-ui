import parseQueryString from 'utils/parseQueryString';

export const getYoutubeVideoIDFromURL = (videoUrl) => {
  const { v } = parseQueryString(videoUrl);

  // for this kind of link format that YouTube uses
  // (from search bar URL) https://www.youtube.com/watch?v=JSURzPQnkl0
  // The video ID is in the 'v' search params
  return v;
};

// source : https://stackoverflow.com/a/34032367
const THUMBNAIL_IMAGE_QUALITY = {
  LOW: 'sddefault',
  MEDIUM: 'mqdefault',
  HIGH: 'hqdefault',
  MAX: 'maxresdefault',
};

const YOUTUBE_THUMBNAIL_BASE_URL = 'https://img.youtube.com/vi';

export const generateYoutubeThumbnailURL = (videoUrl) => {
  const videoID = getYoutubeVideoIDFromURL(videoUrl);

  const imageQuality = THUMBNAIL_IMAGE_QUALITY.HIGH;

  return `${YOUTUBE_THUMBNAIL_BASE_URL}/${videoID}/${imageQuality}.jpg`;
};
