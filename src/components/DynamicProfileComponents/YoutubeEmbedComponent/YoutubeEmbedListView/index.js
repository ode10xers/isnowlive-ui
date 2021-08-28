import React, { useState } from 'react';

import { Row, Col, Button } from 'antd';

import styles from './style.module.scss';
import { getYoutubeVideoIDFromURL } from 'utils/video';
import YoutubeEmbedListItem from '../YoutubeEmbedListItem';

const YoutubeVideoEmbed = ({ videoId = null }) =>
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

const YoutubeEmbedListView = ({ urls = [], isContained = false }) => {
  const [selectedYoutubeVideoID, setSelectedYoutubeVideoID] = useState(null);

  const renderYoutubeVideoListItem = (url, idx) => (
    <Col
      xs={isContained ? 24 : 11}
      md={isContained ? 12 : 8}
      key={`${idx}_${url}`}
      onClick={() => setSelectedYoutubeVideoID(getYoutubeVideoIDFromURL(url))}
    >
      <YoutubeEmbedListItem url={url} />
    </Col>
  );

  return (
    <div>
      {selectedYoutubeVideoID && (
        <Row gutter={[4, 8]} className={styles.mb10}>
          <Col xs={24}>
            <YoutubeVideoEmbed videoId={selectedYoutubeVideoID} />
          </Col>
          <Col xs={24}>
            <Button className={styles.closePlayerButton} type="link" onClick={() => setSelectedYoutubeVideoID(null)}>
              Close Player
            </Button>
          </Col>
        </Row>
      )}
      <Row gutter={[8, 8]} className={isContained ? undefined : styles.youtubeItemListContainer}>
        {urls.map(renderYoutubeVideoListItem)}
      </Row>
    </div>
  );
};

export default YoutubeEmbedListView;
