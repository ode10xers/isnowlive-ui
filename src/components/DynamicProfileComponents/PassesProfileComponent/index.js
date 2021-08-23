import React, { useState, useCallback, useEffect } from 'react';
import { Spin, Row, Col, Space, Button, Typography } from 'antd';
import { LikeOutlined } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';
import dummy from 'data/dummy';

import PassesListView from './PassesListView';
import PassesEditView from './PassesEditView';
import DragAndDropHandle from '../DragAndDropHandle';
import ContainerCard from 'components/ContainerCard';
import DynamicProfileComponentContainer from 'components/DynamicProfileComponentContainer';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';

const { Text } = Typography;

const PassesProfileComponent = ({
  identifier = null,
  isEditing = false,
  isContained = false,
  isLiveData = true,
  dummyTemplateType = 'YOGA',
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
    if (!isLiveData) {
      setPasses(dummy[dummyTemplateType].PASSES ?? []);
    } else {
      fetchCreatorPasses();
    }
  }, [fetchCreatorPasses, isLiveData, dummyTemplateType]);

  const saveEditChanges = (newConfig) => updateConfigHandler(identifier, newConfig);

  const dragAndDropHandleComponent = <DragAndDropHandle {...dragHandleProps} />;

  const editingViewComponent = (
    <PassesEditView configValues={customComponentProps} updateHandler={saveEditChanges} isContained={isContained} />
  );

  const componentChildren = isEditing ? (
    <Row gutter={[8, 8]} justify="center" align="center">
      <Col className={styles.textAlignCenter}>
        <Space align="center" className={styles.textAlignCenter}>
          <Text> The passes you have created will show up here </Text>
          <Button
            type="primary"
            onClick={() => window.open(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.passes, '_blank')}
          >
            Manage my passes
          </Button>
        </Space>
      </Col>
    </Row>
  ) : (
    <Spin spinning={isLoading} tip="Fetching Passes">
      <PassesListView passes={passes || []} isContained={isContained} />
    </Spin>
  );

  const commonContainerProps = {
    title: customComponentProps?.title ?? 'CREDIT PASSES',
    icon: <LikeOutlined className={styles.mr10} />,
  };

  return passes.length > 0 || isEditing ? (
    <Row className={styles.p10} align="middle" justify="center">
      {isContained ? (
        <>
          {isEditing && <Col xs={1}>{dragAndDropHandleComponent}</Col>}
          <Col xs={isEditing ? 22 : 24}>
            <ContainerCard {...commonContainerProps}>{componentChildren}</ContainerCard>
          </Col>
          {isEditing && <Col xs={1}>{editingViewComponent}</Col>}
        </>
      ) : (
        <Col xs={24}>
          <DynamicProfileComponentContainer
            {...commonContainerProps}
            isEditing={isEditing}
            dragDropHandle={dragAndDropHandleComponent}
            editView={editingViewComponent}
          >
            {componentChildren}
          </DynamicProfileComponentContainer>
        </Col>
      )}
    </Row>
  ) : null;
};

export default PassesProfileComponent;
