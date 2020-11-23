import React from 'react';
import { Row, Col, Button } from 'antd';
import { useHistory } from 'react-router-dom';

import { useGlobalContext } from 'services/globalContext';

import styles from './style.module.scss';

const Header = () => {
  const { logOut } = useGlobalContext();
  const history = useHistory();

  return (
    <Row className={styles.headerContainer}>
      <Col flex="auto"></Col>
      <Col flex="100px">
        <Button type="text" onClick={() => logOut(history)}>
          Logout
        </Button>
      </Col>
    </Row>
  );
};

export default Header;
