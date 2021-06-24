import React, { useState, useCallback, useEffect } from 'react';
import { Card, Typography, Spin, Row, Col } from 'antd';
import { LikeTwoTone } from '@ant-design/icons';

import apis from 'apis';

import PassesListView from './PassesListView';
import PassesEditView from './PassesEditView';

import { isAPISuccess } from 'utils/helper';

import styles from './style.module.scss';

const { Text } = Typography;

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
  updateConfigHandler,
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
      <Card
        title={<ContainerTitle title={customComponentProps?.title} />}
        headStyle={cardHeadingStyle}
        className={styles.profileComponentContainer}
        bodyStyle={{ padding: 12 }}
      >
        {isEditing ? (
          <Row justify="center" align="center">
            <Col className={styles.textAlignCenter}>Passes that you have published will show up here</Col>
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
