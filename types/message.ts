import { DateTime } from 'luxon';
import { Maybe, MessagePartsFragment } from '~/graphql/schema';
import { getRandomIntInRange, getRandomString } from '~/tools/util';

export enum MessageState {
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
}

export enum MessageType {
  SYSTEM = 1,
  GENERAL = 2,
  LOGIN = 3,
  LOGOUT = 4,
  DONATION = 5,
  POLL = 6,
}

export interface DonationJson {
  id: number;
  username: string;
  message: string;
  amount: number;
  currency: string;
}

export class Message {
  id: number;
  randomId: Maybe<string>;
  content: string;
  username: Maybe<string>;
  schema: string;
  json: Maybe<DonationJson>;
  type: MessageType;
  createdAt: string;
  createdAtMillis: number;
  updatedAt: string;
  updatedAtMillis: number;
  deletedAt: Maybe<string>;
  owner: MessagePartsFragment['owner'];
  pictures: MessagePartsFragment['pictures'];
  deletedBy: MessagePartsFragment['deletedBy'];
  poll: MessagePartsFragment['poll'];
  state: MessageState = MessageState.DELIVERED;

  constructor(message: MessagePartsFragment) {
    this.id = message.id;
    this.randomId = message.randomId ?? null;
    this.content = message.content;
    this.username = message.username ?? null;
    this.schema = message.schema;
    this.json = message.json ? JSON.parse(message.json) : null;
    this.type = message.type;
    this.createdAt = message.createdAt;
    this.createdAtMillis = DateTime.fromISO(message.createdAt).toMillis();
    this.updatedAt = message.updatedAt;
    this.updatedAtMillis = DateTime.fromISO(message.updatedAt).toMillis();
    this.deletedAt = message.deletedAt ?? null;
    this.owner = message.owner ?? null;
    this.pictures = message.pictures ?? [];
    this.deletedBy = message.deletedBy ?? null;
    this.poll = message.poll ?? null;
  }

  static create(content: string, owner: MessagePartsFragment['owner']): Message {
    const isoDate = DateTime.local().toISO();

    const message = new Message({
      id: getRandomIntInRange(2e7, 2e8),
      randomId: getRandomString(32),
      content,
      username: owner?.username ?? null,
      schema: '1',
      json: null,
      type: MessageType.GENERAL,
      createdAt: isoDate,
      updatedAt: isoDate,
      deletedAt: null,
      owner,
      pictures: [],
      deletedBy: null,
    });

    message.state = MessageState.SENT;

    return message;
  }

  /**
   * Fixes: "Cannot stringify arbitrary non-POJOs Message" warning
   */
  toJSON(): Message {
    return { ...this };
  }
}
