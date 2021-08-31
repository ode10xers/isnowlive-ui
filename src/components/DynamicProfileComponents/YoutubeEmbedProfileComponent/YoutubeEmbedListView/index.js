import React, { useState } from 'react';

import { Row, Col, Button } from 'antd';

import YoutubeEmbedListItem from '../YoutubeEmbedListItem';
import YoutubeVideoEmbed from 'components/YoutubeVideoEmbed';

import { getYoutubeVideoIDFromURL } from 'utils/video';

import styles from './style.module.scss';

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
        {urls.filter((url) => url).map(renderYoutubeVideoListItem)}
      </Row>
    </div>
  );
};

export default YoutubeEmbedListView;
