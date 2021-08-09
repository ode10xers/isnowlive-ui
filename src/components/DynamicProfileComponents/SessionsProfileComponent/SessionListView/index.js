import React, { useMemo } from 'react';
import classNames from 'classnames';

import { useHistory } from 'react-router-dom';
import moment from 'moment';

import { Row, Col, Button, Space, Typography, DatePicker } from 'antd';

import Routes from 'routes';

import SessionListCard from '../SessionListCard';

import dateUtil from 'utils/date';
import { getLocalUserDetails } from 'utils/storage';
import {
  generateUrlFromUsername,
  isInCreatorDashboard,
  preventDefaults,
  isBrightColorShade,
  convertHexToRGB,
} from 'utils/helper';

import styles from './style.module.scss';

const {
  formatDate: { toLongDateWithDay },
} = dateUtil;

const { Title } = Typography;

// NOTE: The actual data that is shown here is inventories
const SessionListView = ({ limit = 2, sessions = [], profileColor }) => {
  const history = useHistory();

  const handleMoreClicked = (e) => {
    preventDefaults(e);

    if (isInCreatorDashboard()) {
      const localUserDetails = getLocalUserDetails();

      window.open(generateUrlFromUsername(localUserDetails?.username ?? 'app') + Routes.list.sessions);
    } else {
      history.push(Routes.list.sessions);
    }
  };

  const renderSessionCards = (session) => (
    <Col xs={24} sm={12} key={`${session.session_external_id}_${session?.inventory_id}`}>
      <SessionListCard session={session} />
    </Col>
  );

  return (
    <div>
      <Row gutter={[16, 16]}>{sessions?.length > 0 && sessions.map(renderSessionCards)}</Row>
    </div>
  );
};

export default SessionListView;
