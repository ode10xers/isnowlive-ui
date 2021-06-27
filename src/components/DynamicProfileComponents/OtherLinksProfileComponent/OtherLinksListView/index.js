import React from 'react';
import LinkPreview from '@ashwamegh/react-link-preview';
import { Row, Col } from 'antd';

import OtherLinksListItem from '../OtherLinksListItem';

const OtherLinksListView = ({ links = [] }) => (
  <Row gutter={[8, 16]}>
    {links.map((link) => (
      <Col xs={24} md={12} key={link} onClick={() => window.open(link, '_blank')}>
        <LinkPreview url={link} render={OtherLinksListItem} />
      </Col>
    ))}
  </Row>
);

export default OtherLinksListView;
