import React from 'react';
// import LinkPreview from '@ashwamegh/react-link-preview';
import { Row, Col } from 'antd';

import OtherLinksListItem from '../OtherLinksListItem';

const OtherLinksListView = ({ links = [], isContained = false }) => (
  <Row gutter={[8, 16]}>
    {/* {links.map((link) => (
      <Col xs={24} md={12} key={link} onClick={() => window.open(link, '_blank')}>
        <LinkPreview url={link} render={OtherLinksListItem} />
      </Col>
    ))} */}
    {links.map((link) => (
      <Col xs={24} md={12} lg={isContained ? 12 : 8} key={link.url} onClick={() => window.open(link.url, '_blank')}>
        <OtherLinksListItem link={link} />
      </Col>
    ))}
  </Row>
);

export default OtherLinksListView;
