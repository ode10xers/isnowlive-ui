import React from 'react';
import { Menu, Dropdown, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  ShareAltOutlined,
  FacebookOutlined,
  InstagramOutlined,
  LinkedinOutlined,
  RedditOutlined,
  TwitterOutlined,
  WhatsAppOutlined,
} from '@ant-design/icons';
import {
  FacebookShareButton,
  InstapaperShareButton,
  LinkedinShareButton,
  RedditShareButton,
  TwitterShareButton,
  WhatsappShareButton,
} from 'react-share';

import { isMobileDevice } from 'utils/device';

const { Item } = Menu;

const Share = ({ label, title, shareUrl }) => {
  const { t } = useTranslation();

  const menu = (
    <Menu>
      <Item icon={<FacebookOutlined />}>
        <FacebookShareButton url={shareUrl} quote={title}>
          {t('FACEBOOK')}
        </FacebookShareButton>
      </Item>
      <Item icon={<InstagramOutlined />}>
        <InstapaperShareButton url={shareUrl} title={title}>
          {t('INSTAGRAM')}
        </InstapaperShareButton>
      </Item>
      <Item icon={<LinkedinOutlined />}>
        <LinkedinShareButton url={shareUrl}>{t('LINKEDIN')}</LinkedinShareButton>
      </Item>
      <Item icon={<RedditOutlined />}>
        <RedditShareButton url={shareUrl} title={title} windowWidth={660} windowHeight={460}>
          {t('REDDIT')}
        </RedditShareButton>
      </Item>
      <Item icon={<TwitterOutlined />}>
        <TwitterShareButton url={shareUrl} title={title}>
          {t('TWITTER')}
        </TwitterShareButton>
      </Item>
      <Item icon={<WhatsAppOutlined />}>
        <WhatsappShareButton url={shareUrl} title={title} separator=":: ">
          {t('WHATSAPP')}
        </WhatsappShareButton>
      </Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} placement="bottomLeft">
      <Button size={isMobileDevice ? 'small' : 'middle'} icon={<ShareAltOutlined />}>
        {label}
      </Button>
    </Dropdown>
  );
};

export default Share;
