import parseQueryString from 'utils/parseQueryString';
import { generateQueryString } from './helper';

export const getYoutubeVideoDetails = async (videoUrl) => {
  const queryStrings = generateQueryString({
    format: 'json',
    url: encodeURIComponent(videoUrl),
  });

  const baseUrl = 'https://www.youtube.com/oembed';
  const response = await fetch(`${baseUrl}?${queryStrings}`);

  const youtubeVideoDetails = await response.json();

  console.log(youtubeVideoDetails);
  return youtubeVideoDetails;
};

export const getYoutubeVideoIDFromURL = (videoUrl) => {
  // There are 2 possible values for YouTube Video Links

  if (videoUrl.includes('www.youtube.com/watch')) {
    // Search bar URL (https://www.youtube.com/watch?v=JSURzPQnkl0)
    // the videoID is in the 'v' in search aprams
    const { v } = parseQueryString(videoUrl);
    return v;
  } else {
    // The Copy link from share button (https://youtu.be/JSURzPQnkl0)
    // The videoID is in the path
    const videoId = videoUrl.replace('https://youtu.be/', '');
    return videoId;
  }
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
