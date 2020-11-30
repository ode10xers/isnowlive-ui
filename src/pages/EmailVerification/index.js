import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useHistory } from 'react-router-dom';

import { Row, message } from 'antd';
import Loader from 'components/Loader';
import apis from 'apis';
import Routes from 'routes';
import { isAPISuccess } from 'utils/helper';

export default function EmailVerification() {
  const history = useHistory();
  const location = useLocation();
  const token = location.pathname.replace('/email/verify/', '');
  const [isLoading, setIsLoading] = useState(false);

  const verifyUserEmail = useCallback(async () => {
    try {
      setIsLoading(true);
      const { status } = await apis.user.verifyEmail({ token });
      if (isAPISuccess(status)) {
        history.push(Routes.createPassword, { token: token });
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Something went wrong.');
    }
  }, [token, history]);

  useEffect(() => {
    if (token) {
      verifyUserEmail();
    }
  }, [token, verifyUserEmail]);

  return (
    <Row justify="center" align="center">
      <Loader loading={isLoading} size="large" text="Verifying email" />
    </Row>
  );
}
