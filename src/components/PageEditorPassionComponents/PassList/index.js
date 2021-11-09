import React, { useState, useEffect, useCallback } from 'react';

import { Row, Col, Empty, Spin } from 'antd';

import apis from 'apis';
import layouts from '../layouts';

import PassesListItem from 'components/DynamicProfileComponents/PassesProfileComponent/PassesListItem';

import { isAPISuccess } from 'utils/helper';

import styles from './styles.module.scss';

// NOTE : These comopnents will have a similar style to components\DynamicProfileComponents\SessionsProfileComponent
// But with the customizations intended for PageEditors
const PassList = ({ layout = layouts.GRID, padding = 8 }) => {
  const isGrid = layout === layouts.GRID;

  const [passes, setPasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
    <Col xs={isGrid ? 12 : 10} md={isGrid ? 8 : 9} lg={isGrid ? 8 : 5} key={pass.external_id}>
      <PassesListItem pass={pass} />
    </Col>
  );

  return (
    <div
      style={{
        padding: typeof padding === 'string' ? parseInt(padding) : padding,
      }}
    >
      <Spin spinning={isLoading} tip="Fetching passes data...">
        {passes.length > 0 ? (
          <Row gutter={[8, 8]} className={isGrid ? undefined : styles.passListContainer}>
            {passes.map(renderPassListItems)}
          </Row>
        ) : (
          <Empty description="No passes found" />
        )}
      </Spin>
    </div>
  );
};

export default PassList;
