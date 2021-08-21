import React from 'react';

import { Row, Col } from 'antd';

import PassesListItem from '../PassesListItem';

const PassesListView = ({ passes = [], isContained = false }) => {
  const renderPassListItems = (pass) => (
    <Col xs={12} md={8} lg={isContained ? 8 : 6} key={pass.external_id}>
      <PassesListItem pass={pass} />
    </Col>
  );

  return <div>{passes?.length > 0 && <Row gutter={[12, 16]}>{passes.map(renderPassListItems)}</Row>}</div>;
};

export default PassesListView;
