import React, { useState, useCallback, useEffect } from 'react';

import { Row, Col, Spin } from 'antd';

import apis from 'apis';

import PassesListItem from '../PassesListItem';

import { isAPISuccess } from 'utils/helper';

const PassesListView = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [passes, setPasses] = useState([]);

  const fetchCreatorPasses = useCallback(async () => {
    setIsLoading(true);

    try {
      const { status, data } = await apis.passes.getPassesByUsername();

      if (isAPISuccess(status) && data) {
        setPasses(data);
      }
    } catch (error) {
      console.error(error);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchCreatorPasses();
  }, [fetchCreatorPasses]);

  const renderPassListItems = (pass) => (
    <Col xs={12} sm={8} key={pass.external_id}>
      <PassesListItem pass={pass} />
    </Col>
  );

  return (
    <div>
      <Spin spinning={isLoading} tip="Fetching Passes">
        {passes?.length > 0 && <Row gutter={[12, 16]}>{passes.map(renderPassListItems)}</Row>}
      </Spin>
    </div>
  );
};

export default PassesListView;
