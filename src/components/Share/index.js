import React, { useState, useEffect } from 'react';
import { Menu, Dropdown, Button } from 'antd';
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
  const menu = (
    <Menu>
      <Item icon={<FacebookOutlined />}>
        <FacebookShareButton url={shareUrl} quote={title}>
          Facebook
        </FacebookShareButton>
      </Item>
      <Item icon={<InstagramOutlined />}>
        <InstapaperShareButton url={shareUrl} title={title}>
          Instagram
        </InstapaperShareButton>
      </Item>
      <Item icon={<LinkedinOutlined />}>
        <LinkedinShareButton url={shareUrl}>LinkedIn</LinkedinShareButton>
      </Item>
      <Item icon={<RedditOutlined />}>
        <RedditShareButton url={shareUrl} title={title} windowWidth={660} windowHeight={460}>
          Reddit
        </RedditShareButton>
      </Item>
      <Item icon={<TwitterOutlined />}>
        <TwitterShareButton url={shareUrl} title={title}>
          Twitter
        </TwitterShareButton>
      </Item>
      <Item icon={<WhatsAppOutlined />}>
        <WhatsappShareButton url={shareUrl} title={title} separator=":: ">
          What's App
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
