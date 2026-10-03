export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: any;
};

export type Message = {
  __typename?: 'Message';
  id: Scalars['Int'];
  ownerId?: Maybe<Scalars['Float']>;
  randomId?: Maybe<Scalars['String']>;
  system: Scalars['Boolean'];
  content: Scalars['String'];
  username?: Maybe<Scalars['String']>;
  deletedById?: Maybe<Scalars['Float']>;
  schema: Scalars['String'];
  json?: Maybe<Scalars['String']>;
  type: Scalars['Int'];
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
  deletedAt?: Maybe<Scalars['DateTime']>;
  owner?: Maybe<User>;
  pictures: Array<Picture>;
  deletedBy?: Maybe<User>;
};

export type Mutation = {
  __typename?: 'Mutation';
  updateOnlineStatus: Scalars['Boolean'];
  updateAvatar: User;
  punish: User;
  unpunish: User;
  updateMessage: Message;
  createMessage: Message;
  deleteMessage: Message;
  signIn: Token;
  signUp: User;
  OAuthDiscord: Token;
  confirmEmail: Token;
  requestEmailConfirmation: User;
  requestPasswordReset: Scalars['Boolean'];
  resetPassword: Token;
  updateUsername: User;
  invalidateCurrentToken: Scalars['Boolean'];
  invalidateTokenById: Scalars['Boolean'];
  invalidateAllTokens: Scalars['Boolean'];
  createPoll: Message;
  votePoll: Poll;
};

export type MutationUpdateAvatarArgs = {
  pictureId: Scalars['Int'];
};

export type MutationPunishArgs = {
  userId: Scalars['Int'];
  type: PunishmentTypes;
  reason: Scalars['String'];
  duration?: Maybe<Scalars['Int']>;
};

export type MutationUnpunishArgs = {
  userId: Scalars['Int'];
};

export type MutationUpdateMessageArgs = {
  messageId: Scalars['Int'];
  content?: Maybe<Scalars['String']>;
};

export type MutationCreateMessageArgs = {
  content?: Maybe<Scalars['String']>;
  randomId?: Maybe<Scalars['String']>;
  pictures?: Maybe<Array<Scalars['Int']>>;
};

export type MutationDeleteMessageArgs = {
  messageId: Scalars['Int'];
};

export type MutationSignInArgs = {
  email: Scalars['String'];
  password: Scalars['String'];
};

export type MutationSignUpArgs = {
  email: Scalars['String'];
  username?: Maybe<Scalars['String']>;
  password: Scalars['String'];
};

export type MutationOAuthDiscordArgs = {
  code: Scalars['String'];
};

export type MutationConfirmEmailArgs = {
  token: Scalars['String'];
};

export type MutationRequestPasswordResetArgs = {
  email: Scalars['String'];
};

export type MutationResetPasswordArgs = {
  token: Scalars['String'];
  password: Scalars['String'];
};

export type MutationUpdateUsernameArgs = {
  username: Scalars['String'];
};

export type MutationInvalidateTokenByIdArgs = {
  id: Scalars['Int'];
};

export type MutationCreatePollArgs = {
  question: Scalars['String'];
  options: Array<Scalars['String']>;
};

export type MutationVotePollArgs = {
  messageId: Scalars['Int'];
  optionIndex: Scalars['Int'];
};

export type Picture = {
  __typename?: 'Picture';
  id: Scalars['Int'];
  ownerId?: Maybe<Scalars['Int']>;
  sId: Scalars['Int'];
  mId: Scalars['Int'];
  oId: Scalars['Int'];
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
  owner: User;
  s: PictureRepresentation;
  m: PictureRepresentation;
  o: PictureRepresentation;
};

export type PictureRepresentation = {
  __typename?: 'PictureRepresentation';
  id: Scalars['Int'];
  height: Scalars['Float'];
  width: Scalars['Float'];
  size: Scalars['Float'];
  path: Scalars['String'];
  link: Scalars['String'];
};

export type Poll = {
  __typename?: 'Poll';
  messageId: Scalars['Int'];
  question: Scalars['String'];
  options: Array<PollOption>;
  selectedOption?: Maybe<Scalars['Int']>;
  totalVotes?: Maybe<Scalars['Int']>;
};

export type PollOption = {
  __typename?: 'PollOption';
  label: Scalars['String'];
  votes?: Maybe<Scalars['Int']>;
};

export enum PunishmentTypes {
  Ban = 'ban',
  Mute = 'mute',
}

export type Query = {
  __typename?: 'Query';
  getCurrentUser: User;
  getUserById: User;
  getOnline: Array<User>;
  searchUsers: Array<User>;
  getMessages: Array<Message>;
  isUsernameFree: Scalars['Boolean'];
  getTokenByDiscordId?: Maybe<Token>;
  getTokens: Array<Token>;
  getPoll: Poll;
  getGrants: Scalars['String'];
  getHello: Scalars['String'];
  version: Scalars['String'];
  getPictureById: Picture;
};

export type QueryGetUserByIdArgs = {
  id: Scalars['Int'];
};

export type QuerySearchUsersArgs = {
  query: Scalars['String'];
};

export type QueryGetMessagesArgs = {
  count?: Maybe<Scalars['Int']>;
  page?: Maybe<Scalars['Int']>;
  lastId?: Maybe<Scalars['Int']>;
  fromDateTime?: Maybe<Scalars['String']>;
  reverse?: Maybe<Scalars['Boolean']>;
  poll?: Maybe<Scalars['Boolean']>;
};

export type QueryIsUsernameFreeArgs = {
  username: Scalars['String'];
};

export type QueryGetTokenByDiscordIdArgs = {
  id: Scalars['String'];
};

export type QueryGetPollArgs = {
  messageId: Scalars['Int'];
};

export type QueryGetPictureByIdArgs = {
  pictureId: Scalars['Int'];
};

export type Role = {
  __typename?: 'Role';
  id: Scalars['Int'];
  name: Scalars['String'];
};

export type Subscription = {
  __typename?: 'Subscription';
  onlineUpdated: Array<User>;
  userUpdated: User;
  messageCreated: Message;
  messageDeleted: Message;
  messageUpdated: Message;
  userRegisteredViaDiscord: Scalars['String'];
};

export type Token = {
  __typename?: 'Token';
  id: Scalars['Int'];
  value: Scalars['String'];
  ownerId: Scalars['Int'];
  createdAt: Scalars['DateTime'];
  expiresAt?: Maybe<Scalars['DateTime']>;
  usedAt?: Maybe<Scalars['DateTime']>;
};

export type User = {
  __typename?: 'User';
  id: Scalars['Int'];
  username?: Maybe<Scalars['String']>;
  avatarId?: Maybe<Scalars['String']>;
  state: UserState;
  wasOnlineAt?: Maybe<Scalars['DateTime']>;
  createdAt: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
  roles: Array<Role>;
  avatar?: Maybe<Picture>;
  emailConfirmed?: Maybe<Scalars['Boolean']>;
  muted?: Maybe<Scalars['Boolean']>;
  email?: Maybe<Scalars['String']>;
};

export enum UserState {
  Online = 'ONLINE',
  Idle = 'IDLE',
  Offline = 'OFFLINE',
}

export type MessagePartsFragment = { __typename?: 'Message' } & Pick<
  Message,
  | 'id'
  | 'randomId'
  | 'content'
  | 'username'
  | 'schema'
  | 'type'
  | 'json'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
> & {
    owner?: Maybe<
      { __typename?: 'User' } & Pick<User, 'id' | 'username'> & {
          avatar?: Maybe<
            { __typename?: 'Picture' } & Pick<Picture, 'id'> & {
                s: { __typename?: 'PictureRepresentation' } & Pick<PictureRepresentation, 'id' | 'link'>;
              }
          >;
        }
    >;
    pictures: Array<
      { __typename?: 'Picture' } & {
        m: { __typename?: 'PictureRepresentation' } & Pick<
          PictureRepresentation,
          'id' | 'link' | 'width' | 'height'
        >;
        o: { __typename?: 'PictureRepresentation' } & Pick<
          PictureRepresentation,
          'id' | 'link' | 'width' | 'height'
        >;
      }
    >;
    deletedBy?: Maybe<{ __typename?: 'User' } & Pick<User, 'id' | 'username'>>;
  };

export type OnlinePartsFragment = { __typename?: 'User' } & Pick<
  User,
  'id' | 'username' | 'email' | 'emailConfirmed' | 'createdAt' | 'wasOnlineAt'
> & {
    avatar?: Maybe<
      { __typename?: 'Picture' } & Pick<Picture, 'id'> & {
          s: { __typename?: 'PictureRepresentation' } & Pick<
            PictureRepresentation,
            'id' | 'height' | 'width' | 'link' | 'size'
          >;
          m: { __typename?: 'PictureRepresentation' } & Pick<
            PictureRepresentation,
            'id' | 'height' | 'width' | 'link' | 'size'
          >;
          o: { __typename?: 'PictureRepresentation' } & Pick<
            PictureRepresentation,
            'id' | 'height' | 'width' | 'link' | 'size'
          >;
        }
    >;
    roles: Array<{ __typename?: 'Role' } & Pick<Role, 'id' | 'name'>>;
  };

export type PollPartsFragment = { __typename?: 'Poll' } & Pick<
  Poll,
  'messageId' | 'question' | 'selectedOption' | 'totalVotes'
> & { options: Array<{ __typename?: 'PollOption' } & Pick<PollOption, 'label' | 'votes'>> };

export type UserPartsFragment = { __typename?: 'User' } & Pick<
  User,
  'id' | 'username' | 'email' | 'emailConfirmed' | 'createdAt' | 'wasOnlineAt'
> & {
    avatar?: Maybe<
      { __typename?: 'Picture' } & Pick<Picture, 'id'> & {
          s: { __typename?: 'PictureRepresentation' } & Pick<
            PictureRepresentation,
            'id' | 'height' | 'width' | 'link' | 'size'
          >;
          m: { __typename?: 'PictureRepresentation' } & Pick<
            PictureRepresentation,
            'id' | 'height' | 'width' | 'link' | 'size'
          >;
          o: { __typename?: 'PictureRepresentation' } & Pick<
            PictureRepresentation,
            'id' | 'height' | 'width' | 'link' | 'size'
          >;
        }
    >;
    roles: Array<{ __typename?: 'Role' } & Pick<Role, 'id' | 'name'>>;
  };

export type ConfirmEmailMutationVariables = Exact<{
  token: Scalars['String'];
}>;

export type ConfirmEmailMutation = { __typename?: 'Mutation' } & {
  confirmEmail: { __typename?: 'Token' } & Pick<Token, 'id'>;
};

export type CreateMessageMutationVariables = Exact<{
  content?: Maybe<Scalars['String']>;
  randomId?: Maybe<Scalars['String']>;
  pictures?: Maybe<Array<Scalars['Int']>>;
}>;

export type CreateMessageMutation = { __typename?: 'Mutation' } & {
  createMessage: { __typename?: 'Message' } & Pick<Message, 'id'>;
};

export type CreatePollMutationVariables = Exact<{
  question: Scalars['String'];
  options: Array<Scalars['String']>;
}>;

export type CreatePollMutation = { __typename?: 'Mutation' } & {
  createPoll: { __typename?: 'Message' } & MessagePartsFragment;
};

export type DeleteMessageMutationVariables = Exact<{
  messageId: Scalars['Int'];
}>;

export type DeleteMessageMutation = { __typename?: 'Mutation' } & {
  deleteMessage: { __typename?: 'Message' } & MessagePartsFragment;
};

export type OAuthDiscordMutationVariables = Exact<{
  code: Scalars['String'];
}>;

export type OAuthDiscordMutation = { __typename?: 'Mutation' } & {
  OAuthDiscord: { __typename?: 'Token' } & Pick<Token, 'value' | 'ownerId'>;
};

export type PunishMutationVariables = Exact<{
  userId: Scalars['Int'];
  reason: Scalars['String'];
  duration?: Maybe<Scalars['Int']>;
  type: PunishmentTypes;
}>;

export type PunishMutation = { __typename?: 'Mutation' } & {
  punish: { __typename?: 'User' } & Pick<User, 'id'>;
};

export type RequestEmailConfirmationMutationVariables = Exact<{ [key: string]: never }>;

export type RequestEmailConfirmationMutation = { __typename?: 'Mutation' } & {
  requestEmailConfirmation: { __typename?: 'User' } & Pick<User, 'id'>;
};

export type RequestPasswordResetMutationVariables = Exact<{
  email: Scalars['String'];
}>;

export type RequestPasswordResetMutation = { __typename?: 'Mutation' } & Pick<
  Mutation,
  'requestPasswordReset'
>;

export type ResetPasswordMutationVariables = Exact<{
  token: Scalars['String'];
  password: Scalars['String'];
}>;

export type ResetPasswordMutation = { __typename?: 'Mutation' } & {
  resetPassword: { __typename?: 'Token' } & Pick<Token, 'ownerId' | 'value'>;
};

export type SignInMutationVariables = Exact<{
  email: Scalars['String'];
  password: Scalars['String'];
}>;

export type SignInMutation = { __typename?: 'Mutation' } & {
  signIn: { __typename?: 'Token' } & Pick<Token, 'ownerId' | 'value'>;
};

export type SignUpMutationVariables = Exact<{
  email: Scalars['String'];
  username: Scalars['String'];
  password: Scalars['String'];
}>;

export type SignUpMutation = { __typename?: 'Mutation' } & {
  signUp: { __typename?: 'User' } & Pick<User, 'id' | 'email'>;
};

export type UpdateAvatarMutationVariables = Exact<{
  pictureId: Scalars['Int'];
}>;

export type UpdateAvatarMutation = { __typename?: 'Mutation' } & {
  updateAvatar: { __typename?: 'User' } & {
    avatar?: Maybe<
      { __typename?: 'Picture' } & Pick<Picture, 'id'> & {
          s: { __typename?: 'PictureRepresentation' } & Pick<
            PictureRepresentation,
            'id' | 'height' | 'width' | 'link' | 'size'
          >;
          m: { __typename?: 'PictureRepresentation' } & Pick<
            PictureRepresentation,
            'id' | 'height' | 'width' | 'link' | 'size'
          >;
          o: { __typename?: 'PictureRepresentation' } & Pick<
            PictureRepresentation,
            'id' | 'height' | 'width' | 'link' | 'size'
          >;
        }
    >;
  };
};

export type UpdateMessageMutationVariables = Exact<{
  messageId: Scalars['Int'];
  content: Scalars['String'];
}>;

export type UpdateMessageMutation = { __typename?: 'Mutation' } & {
  updateMessage: { __typename?: 'Message' } & MessagePartsFragment;
};

export type UpdateOnlineStatusMutationVariables = Exact<{ [key: string]: never }>;

export type UpdateOnlineStatusMutation = { __typename?: 'Mutation' } & Pick<Mutation, 'updateOnlineStatus'>;

export type VotePollMutationVariables = Exact<{
  messageId: Scalars['Int'];
  optionIndex: Scalars['Int'];
}>;

export type VotePollMutation = { __typename?: 'Mutation' } & {
  votePoll: { __typename?: 'Poll' } & PollPartsFragment;
};

export type GetChatDataQueryVariables = Exact<{
  fromDateTime?: Maybe<Scalars['String']>;
  reverse?: Maybe<Scalars['Boolean']>;
}>;

export type GetChatDataQuery = { __typename?: 'Query' } & {
  messages: Array<{ __typename?: 'Message' } & MessagePartsFragment>;
  lastMessages: Array<{ __typename?: 'Message' } & Pick<Message, 'id'>>;
};

export type GetCurrentUserQueryVariables = Exact<{ [key: string]: never }>;

export type GetCurrentUserQuery = { __typename?: 'Query' } & Pick<Query, 'getGrants'> & {
    getCurrentUser: { __typename?: 'User' } & UserPartsFragment;
  };

export type GetGrantsQueryVariables = Exact<{ [key: string]: never }>;

export type GetGrantsQuery = { __typename?: 'Query' } & Pick<Query, 'getGrants'>;

export type GetMessagesQueryVariables = Exact<{
  count?: Maybe<Scalars['Int']>;
  page?: Maybe<Scalars['Int']>;
  lastId?: Maybe<Scalars['Int']>;
  reverse?: Maybe<Scalars['Boolean']>;
  poll?: Maybe<Scalars['Boolean']>;
}>;

export type GetMessagesQuery = { __typename?: 'Query' } & {
  getMessages: Array<{ __typename?: 'Message' } & MessagePartsFragment>;
};

export type GetOnlineQueryVariables = Exact<{ [key: string]: never }>;

export type GetOnlineQuery = { __typename?: 'Query' } & {
  getOnline: Array<{ __typename?: 'User' } & OnlinePartsFragment>;
};

export type GetPollQueryVariables = Exact<{
  messageId: Scalars['Int'];
}>;

export type GetPollQuery = { __typename?: 'Query' } & {
  getPoll: { __typename?: 'Poll' } & PollPartsFragment;
};

export type GetUserByIdQueryVariables = Exact<{
  id: Scalars['Int'];
}>;

export type GetUserByIdQuery = { __typename?: 'Query' } & {
  getUserById: { __typename?: 'User' } & UserPartsFragment;
};

export type GetVersionQueryVariables = Exact<{ [key: string]: never }>;

export type GetVersionQuery = { __typename?: 'Query' } & Pick<Query, 'version'>;

export type SearchUsersQueryVariables = Exact<{
  query: Scalars['String'];
}>;

export type SearchUsersQuery = { __typename?: 'Query' } & {
  searchUsers: Array<{ __typename?: 'User' } & UserPartsFragment>;
};

export type MessageCreatedSubscriptionVariables = Exact<{ [key: string]: never }>;

export type MessageCreatedSubscription = { __typename?: 'Subscription' } & {
  messageCreated: { __typename?: 'Message' } & MessagePartsFragment;
};

export type MessageDeletedSubscriptionVariables = Exact<{ [key: string]: never }>;

export type MessageDeletedSubscription = { __typename?: 'Subscription' } & {
  messageDeleted: { __typename?: 'Message' } & MessagePartsFragment;
};

export type MessageUpdatedSubscriptionVariables = Exact<{ [key: string]: never }>;

export type MessageUpdatedSubscription = { __typename?: 'Subscription' } & {
  messageUpdated: { __typename?: 'Message' } & MessagePartsFragment;
};

export type OnlineUpdatedSubscriptionVariables = Exact<{ [key: string]: never }>;

export type OnlineUpdatedSubscription = { __typename?: 'Subscription' } & {
  onlineUpdated: Array<{ __typename?: 'User' } & OnlinePartsFragment>;
};

export type UserUpdatedSubscriptionVariables = Exact<{ [key: string]: never }>;

export type UserUpdatedSubscription = { __typename?: 'Subscription' } & {
  userUpdated: { __typename?: 'User' } & UserPartsFragment;
};
