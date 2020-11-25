import React, { useState, useEffect, useCallback } from 'react'
import { useLocation, useHistory } from 'react-router-dom';

import { Row } from 'antd';
import Loader from 'components/Loader';

import apis from 'apis';
import Routes from 'routes';
import { isAPISuccess } from 'utils/helper';

export default function EmailVerification() {

  const history = useHistory();
  const location = useLocation();
  const token = location.pathname.replace('/email/verify/', '');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  const verifyUserEmail = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const { data, status } = await apis.user.verifyEmail({ token });
      if (isAPISuccess(status)) {
        history.push(Routes.createPassword, { token: data.auth_token });
      }
    } catch (error) {
      
    }
  }, [token, history]);

  useEffect(() => {
    if (token) {
      verifyUserEmail();
    }
  }, [token, verifyUserEmail])

  return (
    <Row justify="center" align="center">
      <Loader loading={isLoading} size="large" text="Verifying email" />
    </Row>
  )
}
