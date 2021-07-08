import React, { useState, useCallback, useEffect } from 'react';
import { Spin, Row, Col, Space, Button, Typography } from 'antd';
import { LikeTwoTone } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import ContainerCard from 'components/ContainerCard';
import PassesListView from './PassesListView';
import PassesEditView from './PassesEditView';
import DragAndDropHandle from '../DragAndDropHandle';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';

const { Text } = Typography;

const PassesProfileComponent = ({
  identifier = null,
  isEditing = false,
  dragHandleProps,
  updateConfigHandler,
  removeComponentHandler,
  ...customComponentProps
}) => {
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

  const saveEditChanges = (newConfig) => updateConfigHandler(identifier, newConfig);

  return passes.length > 0 || isEditing ? (
    <Row className={styles.p10} align="middle" justify="center" id="passes">
      {isEditing && (
        <Col xs={1}>
          {' '}
          <DragAndDropHandle {...dragHandleProps} />{' '}
        </Col>
      )}
      <Col xs={isEditing ? 22 : 24}>
        <ContainerCard
          title={customComponentProps?.title ?? 'CREDIT PASSES'}
          icon={<LikeTwoTone className={styles.mr10} twoToneColor="#0050B3" />}
        >
          {isEditing ? (
            <Row gutter={[8, 8]} justify="center" align="center">
              <Col className={styles.textAlignCenter}>
                <Space align="center" className={styles.textAlignCenter}>
                  <Text> The passes you have created will show up here </Text>
                  <Button
                    type="primary"
                    onClick={() =>
                      window.open(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.passes, '_blank')
                    }
                  >
                    Manage my passes
                  </Button>
                </Space>
              </Col>
            </Row>
          ) : (
            <Spin spinning={isLoading} tip="Fetching Passes">
              <PassesListView passes={passes || []} />
            </Spin>
          )}
        </ContainerCard>
      </Col>
      {isEditing && (
        <Col xs={1}>
          {' '}
          <PassesEditView configValues={customComponentProps} updateHandler={saveEditChanges} />{' '}
        </Col>
      )}
    </Row>
  ) : null;
};

export default PassesProfileComponent;
