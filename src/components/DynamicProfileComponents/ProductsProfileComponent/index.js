import React, { useState, useCallback, useEffect } from 'react';

import { Route, Switch } from 'react-router-dom';

import { Spin, Typography, Row, Col, Card } from 'antd';
import { VideoCameraTwoTone } from '@ant-design/icons';

import apis from 'apis';
import Routes from 'routes';

import { isAPISuccess } from 'utils/helper';

import SessionListView from '../SessionsProfileComponent/SessionListView';

import styles from './style.module.scss';

const { Text } = Typography;

const ContainerTitle = ({ title = '', icon = null }) => (
  <Text style={{ color: '#0050B3' }}>
    {icon}
    {title}
  </Text>
);

const cardHeadingStyle = {
  background: '#F1FBFF',
  boxShadow: 'inset 0px -1px 0px #E6F5FB',
  color: '#0050B3',
  borderRadius: '12px 12px 0 0',
};

const CardContainer = ({ isEditing, placeholderText, cardHeader, children }) => (
  <Card {...cardHeader} className={styles.profileComponentContainer} bodyStyle={{ padding: 12 }}>
    {isEditing ? (
      <Row justify="center" align="middle">
        <Col>{placeholderText || 'Placeholder text to represent the content'}</Col>
      </Row>
    ) : (
      children
    )}
  </Card>
);

const ProductsProfileComponent = ({ identifier = null, isEditing, updateConfigHandler, ...customComponentProps }) => {
  // TODO: Implement the edit
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);

  const fetchUpcomingSessions = useCallback(async () => {
    try {
      const { status, data } = await apis.user.getSessionsByUsername('upcoming');

      if (isAPISuccess(status) && data) {
        setSessions(data);
      }
    } catch (error) {
      console.error('Failed fetching sessions for creator');
      console.error(error);
    }
  }, []);

  // TODO: Reimplement when we find a way to simplify the API Call
  // e.g. get count of products, which should be much lighter
  useEffect(() => {
    const fetchAllProductsData = async () => {
      setIsLoading(true);
      const sessionsPromise = fetchUpcomingSessions();
      await Promise.all([sessionsPromise]);
      setIsLoading(false);
    };
    fetchAllProductsData();
  }, [fetchUpcomingSessions]);

  const generateCardHeader = (title, icon) => ({
    title: <ContainerTitle title={title} icon={icon} />,
    headStyle: cardHeadingStyle,
  });

  return (
    <div className={styles.p10}>
      <Spin spinning={isLoading} tip="Fetching data...">
        <Switch>
          {sessions.length > 0 && (
            <Route exact path={[Routes.root, Routes.sessions]}>
              {isEditing ? (
                <Row justify="center" align="middle">
                  <Col className={styles.textAlignCenter}>Upcoming sessions that are published will be shown here</Col>
                </Row>
              ) : (
                <CardContainer
                  isEditing={isEditing}
                  placeholderText="Upcoming sessions that are published will be shown here"
                  cardHeader={generateCardHeader(
                    'SESSIONS',
                    <VideoCameraTwoTone className={styles.mr10} twoToneColor="#0050B3" />
                  )}
                >
                  <SessionListView sessions={sessions} />
                </CardContainer>
              )}
            </Route>
          )}
        </Switch>
      </Spin>
    </div>
  );
};

export default ProductsProfileComponent;
