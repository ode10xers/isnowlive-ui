import React, { useState, useEffect, useCallback } from 'react';
import classNames from 'classnames';
import { Row, Col, Image, message, Typography, Button, Space, Form, Input } from 'antd';
import apis from 'apis';
import MobileDetect from 'mobile-detect';
import {
  ShareAltOutlined,
  DownloadOutlined,
  GlobalOutlined,
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
} from '@ant-design/icons';

import SessionDate from '../../components/SessionDate';
import Loader from '../../components/Loader';
import Routes from '../../routes';
import DefaultImage from '../../components/Icons/DefaultImage/index';
import validationRules from '../../utils/validation';
import { formLayout, formTailLayout } from '../../layouts/FormLayouts';

import styles from './style.module.scss';

const { Title, Text } = Typography;

const SessionDetails = ({ match, history }) => {
  const md = new MobileDetect(window.navigator.userAgent);
  const isMobileDevice = Boolean(md.mobile());
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [staff, setStaff] = useState(null);

  const getSessionDetails = useCallback(
    async (sessionId) => {
      try {
        const { data } = await apis.session.getDetails(sessionId);
        if (data?.session) {
          setSession(data.session);
          setStaff(data.staff);
          setIsLoading(false);
        }
      } catch (error) {
        message.error(error.response?.data?.message || 'Something went wrong.');
        setIsLoading(false);
        history.push(Routes.session);
      }
    },
    [history]
  );

  useEffect(() => {
    if (match.params.id) {
      getSessionDetails(match.params.id);
    } else {
      setIsLoading(false);
      message.error('Session details not found.');
    }
  }, [getSessionDetails, match.params.id]);

  const onFinish = (values) => {
    console.log(values);
  };

  return (
    <Loader loading={isLoading} size="large" text="Loading profile">
      <Row justify="space-between" className={styles.mt50}>
        <Col span={24}>
          <Image
            width={session?.session_image_url ? '100%' : 200}
            height={300}
            className={classNames(styles.coverImage, styles.mb20)}
            src={session?.session_image_url || 'error'}
            fallback={DefaultImage()}
          />
        </Col>
        <Col xs={24} md={12}>
          <Title level={isMobileDevice ? 2 : 1}>{session?.name}</Title>
        </Col>
        <Col xs={24} md={12}>
          <SessionDate schedule={session?.schedules[0]} />
        </Col>
      </Row>
      <Row justify="space-between" className={styles.mt50}>
        <Col xs={24} md={3}>
          <Title type="secondary" level={5}>
            Session Type
          </Title>
          <Title level={5} className={styles.subText}>
            {session?.group ? 'Group session' : '1-on-1 Session'}
          </Title>
        </Col>
        <Col xs={24} md={2}>
          <Title type="secondary" level={5}>
            Price
          </Title>
          <Title level={5} className={styles.subText}>
            {session?.price || 0} {session?.currency}
          </Title>
        </Col>
        <Col xs={24} md={6}>
          <Title type="secondary" level={5}>
            Session Prerequisite
          </Title>
          <Title level={5} className={styles.subText}>
            <Button type="link" icon={<DownloadOutlined />} size="middle">
              Download
            </Button>
          </Title>
        </Col>
        <Col xs={24} md={4}></Col>
        <Col xs={24} md={3}>
          <Button icon={<ShareAltOutlined />}>Share</Button>
        </Col>
      </Row>
      <Row justify="space-between" className={styles.mt50}>
        <Col xs={24} md={14}>
          <Title level={5}>Session Prerequisite</Title>
          <Title type="secondary" level={5}>
            Elit, erat urna, sagittis aliquam egestas eu feugiat. Sit aenean nulla luctus imperdiet diam tristique non
            massa vulputate. Enim pulvinar ultrices fusce justo, est phasellus est gravida ultrices. Mauris parturient
            ut elementum gravida amet vitae. Nam quam ultrices suspendisse diam. In proin massa aliquam gravida amet dui
            varius. Consectetur ac commodo tincidunt dolor risus velit scelerisque ullamcorper. Eget arcu porttitor ut
            lorem morbi duis nunc amet, eget.
          </Title>
          <Title level={5} className={styles.mt50}>
            Session Prerequisite
          </Title>
          <Title type="secondary" level={5}>
            Elit, erat urna, sagittis aliquam egestas eu feugiat. Sit aenean nulla luctus imperdiet diam tristique non
            massa vulputate. Enim pulvinar ultrices fusce justo, est phasellus est gravida ultrices. Mauris parturient
            ut elementum gravida amet vitae. Nam quam ultrices suspendisse diam. In proin massa aliquam gravida amet dui
            varius. Consectetur ac commodo tincidunt dolor risus velit scelerisque ullamcorper. Eget arcu porttitor ut
            lorem morbi duis nunc amet, eget.
          </Title>
        </Col>
        <Col xs={24} md={1}></Col>
        <Col xs={24} md={9}>
          <div className={styles.box}>
            <Row>
              <Col xs={24} md={24}>
                <Title level={5}>Host</Title>
              </Col>
              <Col xs={12} md={12}>
                <Image
                  className={isMobileDevice ? styles.profileImageSmall : styles.profileImage}
                  width={isMobileDevice ? 80 : 120}
                  height={isMobileDevice ? 80 : 120}
                  src={staff?.profile.profile_image_url ? staff?.profile.profile_image_url : 'error'}
                  fallback={DefaultImage()}
                />
              </Col>
              <Col xs={12} md={12}>
                <Title className={styles.mt10} level={4}>
                  {staff?.first_name} {staff?.last_name}
                </Title>
                <Title level={5}>Full Profile</Title>
              </Col>
              <Col xs={24} md={24} className={styles.mt10}>
                <Text>
                  Velit habitasse non arcu auctor nisl. Quis risus, placerat at auctor sed. Ultricies sed scelerisque id
                  ante in tristique. Pulvinar venenatis risus ut lorem. Eget mi ut semper sagittis nam. Ac ullamcorper
                  amet condimentum lorem mauris quam. Vestibulum hendrerit at at consequat platea augue proin laoreet.
                  Morbi urna, convallis suspendisse enim eget.
                </Text>
              </Col>
              <Col xs={24} md={24} className={styles.mt10}>
                <Space size={'middle'}>
                  <a href="#/" target="_blank" rel="noopener noreferrer">
                    <GlobalOutlined className={styles.socialIcon} />
                  </a>
                  <a href="#/" target="_blank" rel="noopener noreferrer">
                    <FacebookOutlined className={styles.socialIcon} />
                  </a>
                  <a href="#/" target="_blank" rel="noopener noreferrer">
                    <TwitterOutlined className={styles.socialIcon} />
                  </a>
                  <a href="#/" target="_blank" rel="noopener noreferrer">
                    <InstagramOutlined className={styles.socialIcon} />
                  </a>
                </Space>
              </Col>
            </Row>
          </div>
        </Col>
        <Col xs={24} md={24} className={styles.mt50}>
          <div className={classNames(styles.box, styles.p50)}>
            <Row>
              <Col xs={24} md={24}>
                <Title level={3}>Registration</Title>
              </Col>
              <Col xs={24} md={24}>
                <Text>After you register, we will send you an email with the event login information.</Text>
              </Col>
              <Col xs={24} md={12} className={styles.mt10}>
                <Form {...formLayout} onFinish={onFinish}>
                  <Form.Item label="Name" name="name" rules={validationRules.nameValidation}>
                    <Input placeholder="Enter your name" />
                  </Form.Item>

                  <Form.Item label="Email" name="email" rules={validationRules.emailValidation}>
                    <Input placeholder="Enter your email" />
                  </Form.Item>

                  <Form.Item {...formTailLayout}>
                    <Button type="primary" htmlType="submit">
                      Register
                    </Button>
                  </Form.Item>
                </Form>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>
    </Loader>
  );
};

export default SessionDetails;
