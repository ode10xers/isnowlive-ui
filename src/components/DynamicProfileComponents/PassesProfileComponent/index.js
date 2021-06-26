import React, { useState, useCallback, useEffect } from 'react';
import { Card, Typography, Spin, Row, Col, Button } from 'antd';
import { LikeTwoTone } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import PassesListView from './PassesListView';
import PassesEditView from './PassesEditView';
import DragAndDropHandle from '../DragAndDropHandle';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';

const { Text, Paragraph } = Typography;

const ContainerTitle = ({ title = 'CREDIT PASSES' }) => (
  <Text style={{ color: '#0050B3' }}>
    <LikeTwoTone className={styles.mr10} twoToneColor="#0050B3" />
    {title}
  </Text>
);

// TODO : Later we might want these colors to be customized
const cardHeadingStyle = {
  background: '#F1FBFF',
  boxShadow: 'inset 0px -1px 0px #E6F5FB',
  color: '#0050B3',
  borderRadius: '12px 12px 0 0',
};

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
    <div className={styles.p10}>
      {isEditing && <DragAndDropHandle {...dragHandleProps} />}
      <Card
        title={<ContainerTitle title={customComponentProps?.title} />}
        headStyle={cardHeadingStyle}
        className={styles.profileComponentContainer}
        bodyStyle={{ padding: 12 }}
      >
        {isEditing ? (
          <Row gutter={[8, 8]} justify="center" align="center">
            <Col xs={24} className={styles.textAlignCenter}>
              <Paragraph>Passes that you have created and published will show up here.</Paragraph>
              <Paragraph>You can manage your passes in the dashboard by clicking the button below</Paragraph>
            </Col>
            <Col xs={24}>
              <Row justify="center">
                <Col>
                  <Button
                    type="primary"
                    onClick={() =>
                      window.open(Routes.creatorDashboard.rootPath + Routes.creatorDashboard.passes, '_blank')
                    }
                  >
                    Manage my passes
                  </Button>
                </Col>
              </Row>
            </Col>
          </Row>
        ) : (
          <Spin spinning={isLoading} tip="Fetching Passes">
            <PassesListView passes={passes || []} />
          </Spin>
        )}
      </Card>
      {isEditing && <PassesEditView configValues={customComponentProps} updateHandler={saveEditChanges} />}
    </div>
  ) : null;
};

export default PassesProfileComponent;
