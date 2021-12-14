import type { CSSProperties } from 'react';
import type { DateString, DateTimeString, URI, UUID } from 'types/common';

export interface UpcomingSessionInventory {
  beginning: DateTimeString;
  color_code: CSSProperties['color'];
  creator_username: string;
  currency: string;
  description: string;
  document_urls: URI[];
  end_time: DateTimeString;
  expiry: DateTimeString;
  group: boolean;
  inventory_external_id: UUID;
  inventory_id: number;
  is_active: boolean;
  bundle_only: boolean;
  is_offline: boolean;
  is_published: boolean;
  is_refundable: boolean;
  max_participants: number;
  name: string;
  num_participants: number;
  offline_event_address: string;
  participants: null;
  pay_what_you_want: boolean;
  prerequisites: string;
  price: number;
  recurring: boolean;
  refund_before_hours: number;
  session_date: DateString;
  session_external_id: UUID;
  session_id: number;
  session_image_url: URI;
  start_time: DateTimeString;
  start_url: URI;
  tags: string[];
  total_price: number;
  type: 'AVAILABILITY' | 'NORMAL';
  user_timezone_offset: number;
  user_timezone: string;
}

export interface Session {
  beginning: DateTimeString;
  color_code: CSSProperties['color'];
  creator_username: string;
  currency: string;
  description: string;
  document_urls: URI[];
  expiry: DateTimeString;
  group: boolean;
  inventory: SessionInventory[];
  is_active: boolean;
  bundle_only: boolean;
  is_offline: boolean;
  is_refundable: boolean;
  max_participants: number;
  name: string;
  offline_event_address: string;
  pay_what_you_want: boolean;
  prerequisites: string;
  price: number;
  recurring: boolean;
  refund_before_hours: number;
  session_external_id: UUID;
  session_id: number;
  session_image_url: URI;
  tags: string[];
  total_price: number;
  type: 'AVAILABILITY' | 'NORMAL';
  user_timezone_offset: number;
  user_timezone: string;
  Videos: null;
}

export interface SessionInventory {
  end_time: DateTimeString;
  inventory_external_id: UUID;
  inventory_id: number;
  is_published: boolean;
  num_participants: number;
  offline_event_address: string;
  participants: null;
  session_date: DateString;
  start_time: DateTimeString;
  start_url: URI;
}
