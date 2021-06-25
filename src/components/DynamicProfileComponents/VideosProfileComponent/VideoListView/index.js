import React from 'react';
import { useHistory } from 'react-router-dom';

import { Row, Col, Button } from 'antd';

// import DetailsDrawer from 'components/DynamicProfileComponents/DetailsDrawer';
import VideoListCard from '../VideoListCard';

// import { preventDefaults } from 'utils/helper';

import styles from './style.module.scss';
import Routes from 'routes';

// const { Title } = Typography;

// TODO: Make this not show on viewing mode if videos are empty
// But still show up on editing mode
const VideoListView = ({ limit = 2, videos = [] }) => {
  const history = useHistory();
  // const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);

  // const showMoreVideoCards = (e) => {
  //   preventDefaults(e);
  //   setDetailsDrawerVisible(true);
  // };

  // const handleDrawerClose = (e) => {
  //   preventDefaults(e);
  //   setDetailsDrawerVisible(false);
  // };

  const renderVideoCards = (video, restrictedWidth = true) => {
    return restrictedWidth ? (
      <Col xs={24} sm={12} key={video.external_id}>
        <VideoListCard video={video} />
      </Col>
    ) : (
      <Col xs={24} sm={12} md={8} xl={6} key={video.external_id}>
        <VideoListCard video={video} />
      </Col>
    );
  };

  return (
    <div>
      {videos?.length > 0 && (
        <Row gutter={[16, 16]}>
          {videos.slice(0, limit).map((video) => renderVideoCards(video, true))}
          {videos?.length > limit && (
            <Col xs={24}>
              <Row justify="center">
                <Col>
                  {/* <Button className={styles.moreButton} type="primary" size="large" onClick={showMoreVideoCards}> */}
                  <Button
                    className={styles.moreButton}
                    type="primary"
                    size="large"
                    onClick={() => history.push(Routes.list.videos)}
                  >
                    MORE
                  </Button>
                </Col>
              </Row>
            </Col>
          )}
        </Row>
      )}
      {/* <DetailsDrawer
        visible={detailsDrawerVisible}
        onClose={handleDrawerClose}
        title={<Title level={4}> More Videos </Title>}
      >
        <Row gutter={[16, 16]} className={styles.mb50}>
          {videos.slice(0, limit * 5).map((video) => renderVideoCards(video, false))}
        </Row>
      </DetailsDrawer> */}
    </div>
  );
};

export default VideoListView;
