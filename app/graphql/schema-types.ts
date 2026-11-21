export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2019-12-03T09:54:33Z, compliant with the date-time format. */
  DateTime: { input: string; output: string; }
};

export type Message = {
  __typename?: 'Message';
  content: Scalars['String']['output'];
  createdAt: Scalars['DateTime']['output'];
  deletedAt?: Maybe<Scalars['DateTime']['output']>;
  deletedBy?: Maybe<User>;
  deletedById?: Maybe<Scalars['Float']['output']>;
  id: Scalars['Int']['output'];
  json?: Maybe<Scalars['String']['output']>;
  owner?: Maybe<User>;
  ownerId?: Maybe<Scalars['Float']['output']>;
  pictures: Array<Picture>;
  poll?: Maybe<Poll>;
  randomId?: Maybe<Scalars['String']['output']>;
  schema: Scalars['String']['output'];
  system: Scalars['Boolean']['output'];
  type: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  username?: Maybe<Scalars['String']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  OAuthDiscord: Token;
  cancelPollVote: Poll;
  closePoll: Poll;
  confirmEmail: Token;
  createMessage: Message;
  createPoll: Message;
  deleteMessage: Message;
  invalidateAllTokens: Scalars['Boolean']['output'];
  invalidateCurrentToken: Scalars['Boolean']['output'];
  invalidateTokenById: Scalars['Boolean']['output'];
  punish: User;
  requestEmailConfirmation: User;
  requestPasswordReset: Scalars['Boolean']['output'];
  resetPassword: Token;
  signIn: Token;
  signUp: User;
  unpunish: User;
  updateAvatar: User;
  updateMessage: Message;
  updateOnlineStatus: Scalars['Boolean']['output'];
  updatePoll: Message;
  updateUsername: User;
  votePoll: Poll;
};


export type MutationOAuthDiscordArgs = {
  code: Scalars['String']['input'];
};


export type MutationCancelPollVoteArgs = {
  messageId: Scalars['Int']['input'];
};


export type MutationClosePollArgs = {
  messageId: Scalars['Int']['input'];
};


export type MutationConfirmEmailArgs = {
  token: Scalars['String']['input'];
};


export type MutationCreateMessageArgs = {
  content?: InputMaybe<Scalars['String']['input']>;
  pictures?: InputMaybe<Array<Scalars['Int']['input']>>;
  randomId?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreatePollArgs = {
  allowChangeVote?: InputMaybe<Scalars['Boolean']['input']>;
  allowMultiple?: InputMaybe<Scalars['Boolean']['input']>;
  endsAt?: InputMaybe<Scalars['DateTime']['input']>;
  isAnonymous?: InputMaybe<Scalars['Boolean']['input']>;
  options: Array<Scalars['String']['input']>;
  question: Scalars['String']['input'];
};


export type MutationDeleteMessageArgs = {
  messageId: Scalars['Int']['input'];
};


export type MutationInvalidateTokenByIdArgs = {
  id: Scalars['Int']['input'];
};


export type MutationPunishArgs = {
  duration?: InputMaybe<Scalars['Int']['input']>;
  reason: Scalars['String']['input'];
  type: PunishmentTypes;
  userId: Scalars['Int']['input'];
};


export type MutationRequestPasswordResetArgs = {
  email: Scalars['String']['input'];
};


export type MutationResetPasswordArgs = {
  password: Scalars['String']['input'];
  token: Scalars['String']['input'];
};


export type MutationSignInArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationSignUpArgs = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  username?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUnpunishArgs = {
  userId: Scalars['Int']['input'];
};


export type MutationUpdateAvatarArgs = {
  pictureId: Scalars['Int']['input'];
};


export type MutationUpdateMessageArgs = {
  content?: InputMaybe<Scalars['String']['input']>;
  messageId: Scalars['Int']['input'];
};


export type MutationUpdatePollArgs = {
  allowChangeVote?: InputMaybe<Scalars['Boolean']['input']>;
  allowMultiple?: InputMaybe<Scalars['Boolean']['input']>;
  endsAt?: InputMaybe<Scalars['DateTime']['input']>;
  messageId: Scalars['Int']['input'];
  options: Array<UpdatePollOptionInput>;
  question: Scalars['String']['input'];
};


export type MutationUpdateUsernameArgs = {
  username: Scalars['String']['input'];
};


export type MutationVotePollArgs = {
  messageId: Scalars['Int']['input'];
  optionIds: Array<Scalars['Int']['input']>;
};

export type Picture = {
  __typename?: 'Picture';
  createdAt: Scalars['DateTime']['output'];
  id: Scalars['Int']['output'];
  m: PictureRepresentation;
  mId: Scalars['Int']['output'];
  o: PictureRepresentation;
  oId: Scalars['Int']['output'];
  owner: User;
  ownerId?: Maybe<Scalars['Int']['output']>;
  s: PictureRepresentation;
  sId: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type PictureRepresentation = {
  __typename?: 'PictureRepresentation';
  height: Scalars['Float']['output'];
  id: Scalars['Int']['output'];
  link: Scalars['String']['output'];
  path: Scalars['String']['output'];
  size: Scalars['Float']['output'];
  width: Scalars['Float']['output'];
};

export type Poll = {
  __typename?: 'Poll';
  allowChangeVote: Scalars['Boolean']['output'];
  allowMultiple: Scalars['Boolean']['output'];
  closedAt?: Maybe<Scalars['DateTime']['output']>;
  endsAt?: Maybe<Scalars['DateTime']['output']>;
  isAnonymous: Scalars['Boolean']['output'];
  isClosed: Scalars['Boolean']['output'];
  messageId: Scalars['Int']['output'];
  options: Array<PollOption>;
  question: Scalars['String']['output'];
  selectedOption?: Maybe<Scalars['Int']['output']>;
  selectedOptionIds: Array<Scalars['Int']['output']>;
  serverTime: Scalars['DateTime']['output'];
  totalVotes?: Maybe<Scalars['Int']['output']>;
  voters: Array<PollVoter>;
};

export type PollOption = {
  __typename?: 'PollOption';
  id: Scalars['Int']['output'];
  label: Scalars['String']['output'];
  votes?: Maybe<Scalars['Int']['output']>;
};

export type PollVoter = {
  __typename?: 'PollVoter';
  avatarUrl?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  optionIds: Array<Scalars['Int']['output']>;
  username: Scalars['String']['output'];
  votedAt?: Maybe<Scalars['DateTime']['output']>;
};

export enum PunishmentTypes {
  Ban = 'ban',
  Mute = 'mute'
}

export type Query = {
  __typename?: 'Query';
  getActivePolls: Array<Message>;
  getCurrentUser: User;
  getGrants: Scalars['String']['output'];
  getHello: Scalars['String']['output'];
  getMessages: Array<Message>;
  getOnline: Array<User>;
  getPictureById: Picture;
  getPoll: Poll;
  getTokenByDiscordId?: Maybe<Token>;
  getTokens: Array<Token>;
  getUserById: User;
  isUsernameFree: Scalars['Boolean']['output'];
  searchUsers: Array<User>;
  version: Scalars['String']['output'];
};


export type QueryGetMessagesArgs = {
  count?: InputMaybe<Scalars['Int']['input']>;
  fromDateTime?: InputMaybe<Scalars['String']['input']>;
  lastId?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  poll?: InputMaybe<Scalars['Boolean']['input']>;
  reverse?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryGetPictureByIdArgs = {
  pictureId: Scalars['Int']['input'];
};


export type QueryGetPollArgs = {
  messageId: Scalars['Int']['input'];
};


export type QueryGetTokenByDiscordIdArgs = {
  id: Scalars['String']['input'];
};


export type QueryGetUserByIdArgs = {
  id: Scalars['Int']['input'];
};


export type QueryIsUsernameFreeArgs = {
  username: Scalars['String']['input'];
};


export type QuerySearchUsersArgs = {
  query: Scalars['String']['input'];
};

export type Role = {
  __typename?: 'Role';
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
};

export type Subscription = {
  __typename?: 'Subscription';
  messageCreated: Message;
  messageDeleted: Message;
  messageUpdated: Message;
  onlineUpdated: Array<User>;
  userRegisteredViaDiscord: Scalars['String']['output'];
  userUpdated: User;
};

export type Token = {
  __typename?: 'Token';
  createdAt: Scalars['DateTime']['output'];
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  id: Scalars['Int']['output'];
  ownerId: Scalars['Int']['output'];
  usedAt?: Maybe<Scalars['DateTime']['output']>;
  value: Scalars['String']['output'];
};

export type UpdatePollOptionInput = {
  id?: InputMaybe<Scalars['Int']['input']>;
  label: Scalars['String']['input'];
};

export type User = {
  __typename?: 'User';
  avatar?: Maybe<Picture>;
  avatarId?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['DateTime']['output'];
  email?: Maybe<Scalars['String']['output']>;
  emailConfirmed?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['Int']['output'];
  muted?: Maybe<Scalars['Boolean']['output']>;
  roles: Array<Role>;
  state: UserState;
  updatedAt: Scalars['DateTime']['output'];
  username?: Maybe<Scalars['String']['output']>;
  wasOnlineAt?: Maybe<Scalars['DateTime']['output']>;
};

export enum UserState {
  Idle = 'IDLE',
  Offline = 'OFFLINE',
  Online = 'ONLINE'
}
