/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import type * as Types from './schema-types';

export type MessagePartsFragment = { id: number, randomId: string | null, content: string, username: string | null, schema: string, type: number, json: string | null, createdAt: string, updatedAt: string, deletedAt: string | null, owner: { id: number, username: string | null, avatar: { id: number, s: { id: number, link: string } } | null } | null, poll: { isAnonymous: boolean, closedAt: string | null, messageId: number, question: string, allowMultiple: boolean, allowChangeVote: boolean, endsAt: string | null, isClosed: boolean, serverTime: string, selectedOptionIds: Array<number>, totalVotes: number | null, voters: Array<{ id: number, username: string, avatarUrl: string | null, votedAt: string | null, optionIds: Array<number> }>, options: Array<{ id: number, label: string, votes: number | null }> } | null, pictures: Array<{ m: { id: number, link: string, width: number, height: number }, o: { id: number, link: string, width: number, height: number } }>, deletedBy: { id: number, username: string | null } | null };

export type OnlinePartsFragment = { id: number, username: string | null, email: string | null, emailConfirmed: boolean | null, createdAt: string, wasOnlineAt: string | null, avatar: { id: number, s: { id: number, height: number, width: number, link: string, size: number }, m: { id: number, height: number, width: number, link: string, size: number }, o: { id: number, height: number, width: number, link: string, size: number } } | null, roles: Array<{ id: number, name: string }> };

export type PollPartsFragment = { isAnonymous: boolean, closedAt: string | null, messageId: number, question: string, allowMultiple: boolean, allowChangeVote: boolean, endsAt: string | null, isClosed: boolean, serverTime: string, selectedOptionIds: Array<number>, totalVotes: number | null, voters: Array<{ id: number, username: string, avatarUrl: string | null, votedAt: string | null, optionIds: Array<number> }>, options: Array<{ id: number, label: string, votes: number | null }> };

export type UserPartsFragment = { id: number, username: string | null, email: string | null, emailConfirmed: boolean | null, createdAt: string, wasOnlineAt: string | null, avatar: { id: number, s: { id: number, height: number, width: number, link: string, size: number }, m: { id: number, height: number, width: number, link: string, size: number }, o: { id: number, height: number, width: number, link: string, size: number } } | null, roles: Array<{ id: number, name: string }> };

export type CancelPollVoteMutationVariables = Exact<{
  messageId: number;
}>;


export type CancelPollVoteMutation = { cancelPollVote: { isAnonymous: boolean, closedAt: string | null, messageId: number, question: string, allowMultiple: boolean, allowChangeVote: boolean, endsAt: string | null, isClosed: boolean, serverTime: string, selectedOptionIds: Array<number>, totalVotes: number | null, voters: Array<{ id: number, username: string, avatarUrl: string | null, votedAt: string | null, optionIds: Array<number> }>, options: Array<{ id: number, label: string, votes: number | null }> } };

export type ClosePollMutationVariables = Exact<{
  messageId: number;
}>;


export type ClosePollMutation = { closePoll: { isAnonymous: boolean, closedAt: string | null, messageId: number, question: string, allowMultiple: boolean, allowChangeVote: boolean, endsAt: string | null, isClosed: boolean, serverTime: string, selectedOptionIds: Array<number>, totalVotes: number | null, voters: Array<{ id: number, username: string, avatarUrl: string | null, votedAt: string | null, optionIds: Array<number> }>, options: Array<{ id: number, label: string, votes: number | null }> } };

export type ConfirmEmailMutationVariables = Exact<{
  token: string;
}>;


export type ConfirmEmailMutation = { confirmEmail: { id: number, ownerId: number } };

export type CreateMessageMutationVariables = Exact<{
  content?: string | null | undefined;
  randomId?: string | null | undefined;
  pictures?: Array<number> | number | null | undefined;
}>;


export type CreateMessageMutation = { createMessage: { id: number } };

export type CreatePollMutationVariables = Exact<{
  isAnonymous?: boolean | null | undefined;
  question: string;
  options: Array<string> | string;
  allowMultiple?: boolean | null | undefined;
  allowChangeVote?: boolean | null | undefined;
  endsAt?: string | null | undefined;
}>;


export type CreatePollMutation = { createPoll: { id: number, randomId: string | null, content: string, username: string | null, schema: string, type: number, json: string | null, createdAt: string, updatedAt: string, deletedAt: string | null, owner: { id: number, username: string | null, avatar: { id: number, s: { id: number, link: string } } | null } | null, poll: { isAnonymous: boolean, closedAt: string | null, messageId: number, question: string, allowMultiple: boolean, allowChangeVote: boolean, endsAt: string | null, isClosed: boolean, serverTime: string, selectedOptionIds: Array<number>, totalVotes: number | null, voters: Array<{ id: number, username: string, avatarUrl: string | null, votedAt: string | null, optionIds: Array<number> }>, options: Array<{ id: number, label: string, votes: number | null }> } | null, pictures: Array<{ m: { id: number, link: string, width: number, height: number }, o: { id: number, link: string, width: number, height: number } }>, deletedBy: { id: number, username: string | null } | null } };

export type DeleteMessageMutationVariables = Exact<{
  messageId: number;
}>;


export type DeleteMessageMutation = { deleteMessage: { id: number, randomId: string | null, content: string, username: string | null, schema: string, type: number, json: string | null, createdAt: string, updatedAt: string, deletedAt: string | null, owner: { id: number, username: string | null, avatar: { id: number, s: { id: number, link: string } } | null } | null, poll: { isAnonymous: boolean, closedAt: string | null, messageId: number, question: string, allowMultiple: boolean, allowChangeVote: boolean, endsAt: string | null, isClosed: boolean, serverTime: string, selectedOptionIds: Array<number>, totalVotes: number | null, voters: Array<{ id: number, username: string, avatarUrl: string | null, votedAt: string | null, optionIds: Array<number> }>, options: Array<{ id: number, label: string, votes: number | null }> } | null, pictures: Array<{ m: { id: number, link: string, width: number, height: number }, o: { id: number, link: string, width: number, height: number } }>, deletedBy: { id: number, username: string | null } | null } };

export type OAuthDiscordMutationVariables = Exact<{
  code: string;
}>;


export type OAuthDiscordMutation = { OAuthDiscord: { value: string, ownerId: number } };

export type PunishMutationVariables = Exact<{
  userId: number;
  reason: string;
  duration?: number | null | undefined;
  type: Types.PunishmentTypes;
}>;


export type PunishMutation = { punish: { id: number } };

export type RequestEmailConfirmationMutationVariables = Exact<{ [key: string]: never; }>;


export type RequestEmailConfirmationMutation = { requestEmailConfirmation: { id: number } };

export type RequestPasswordResetMutationVariables = Exact<{
  email: string;
}>;


export type RequestPasswordResetMutation = { requestPasswordReset: boolean };

export type ResetPasswordMutationVariables = Exact<{
  token: string;
  password: string;
}>;


export type ResetPasswordMutation = { resetPassword: { ownerId: number, value: string } };

export type SignInMutationVariables = Exact<{
  email: string;
  password: string;
}>;


export type SignInMutation = { signIn: { ownerId: number, value: string } };

export type SignUpMutationVariables = Exact<{
  email: string;
  username: string;
  password: string;
}>;


export type SignUpMutation = { signUp: { id: number, email: string | null } };

export type UpdateAvatarMutationVariables = Exact<{
  pictureId: number;
}>;


export type UpdateAvatarMutation = { updateAvatar: { avatar: { id: number, s: { id: number, height: number, width: number, link: string, size: number }, m: { id: number, height: number, width: number, link: string, size: number }, o: { id: number, height: number, width: number, link: string, size: number } } | null } };

export type UpdateMessageMutationVariables = Exact<{
  messageId: number;
  content: string;
}>;


export type UpdateMessageMutation = { updateMessage: { id: number, randomId: string | null, content: string, username: string | null, schema: string, type: number, json: string | null, createdAt: string, updatedAt: string, deletedAt: string | null, owner: { id: number, username: string | null, avatar: { id: number, s: { id: number, link: string } } | null } | null, poll: { isAnonymous: boolean, closedAt: string | null, messageId: number, question: string, allowMultiple: boolean, allowChangeVote: boolean, endsAt: string | null, isClosed: boolean, serverTime: string, selectedOptionIds: Array<number>, totalVotes: number | null, voters: Array<{ id: number, username: string, avatarUrl: string | null, votedAt: string | null, optionIds: Array<number> }>, options: Array<{ id: number, label: string, votes: number | null }> } | null, pictures: Array<{ m: { id: number, link: string, width: number, height: number }, o: { id: number, link: string, width: number, height: number } }>, deletedBy: { id: number, username: string | null } | null } };

export type UpdateOnlineStatusMutationVariables = Exact<{ [key: string]: never; }>;


export type UpdateOnlineStatusMutation = { updateOnlineStatus: boolean };

export type UpdatePollMutationVariables = Exact<{
  messageId: number;
  question: string;
  options: Array<Types.UpdatePollOptionInput> | Types.UpdatePollOptionInput;
  allowMultiple?: boolean | null | undefined;
  allowChangeVote?: boolean | null | undefined;
  endsAt?: string | null | undefined;
}>;


export type UpdatePollMutation = { updatePoll: { id: number, randomId: string | null, content: string, username: string | null, schema: string, type: number, json: string | null, createdAt: string, updatedAt: string, deletedAt: string | null, owner: { id: number, username: string | null, avatar: { id: number, s: { id: number, link: string } } | null } | null, poll: { isAnonymous: boolean, closedAt: string | null, messageId: number, question: string, allowMultiple: boolean, allowChangeVote: boolean, endsAt: string | null, isClosed: boolean, serverTime: string, selectedOptionIds: Array<number>, totalVotes: number | null, voters: Array<{ id: number, username: string, avatarUrl: string | null, votedAt: string | null, optionIds: Array<number> }>, options: Array<{ id: number, label: string, votes: number | null }> } | null, pictures: Array<{ m: { id: number, link: string, width: number, height: number }, o: { id: number, link: string, width: number, height: number } }>, deletedBy: { id: number, username: string | null } | null } };

export type VotePollMutationVariables = Exact<{
  messageId: number;
  optionIds: Array<number> | number;
}>;


export type VotePollMutation = { votePoll: { isAnonymous: boolean, closedAt: string | null, messageId: number, question: string, allowMultiple: boolean, allowChangeVote: boolean, endsAt: string | null, isClosed: boolean, serverTime: string, selectedOptionIds: Array<number>, totalVotes: number | null, voters: Array<{ id: number, username: string, avatarUrl: string | null, votedAt: string | null, optionIds: Array<number> }>, options: Array<{ id: number, label: string, votes: number | null }> } };

export type GetActivePollsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActivePollsQuery = { getActivePolls: Array<{ id: number, randomId: string | null, content: string, username: string | null, schema: string, type: number, json: string | null, createdAt: string, updatedAt: string, deletedAt: string | null, owner: { id: number, username: string | null, avatar: { id: number, s: { id: number, link: string } } | null } | null, poll: { isAnonymous: boolean, closedAt: string | null, messageId: number, question: string, allowMultiple: boolean, allowChangeVote: boolean, endsAt: string | null, isClosed: boolean, serverTime: string, selectedOptionIds: Array<number>, totalVotes: number | null, voters: Array<{ id: number, username: string, avatarUrl: string | null, votedAt: string | null, optionIds: Array<number> }>, options: Array<{ id: number, label: string, votes: number | null }> } | null, pictures: Array<{ m: { id: number, link: string, width: number, height: number }, o: { id: number, link: string, width: number, height: number } }>, deletedBy: { id: number, username: string | null } | null }> };

export type GetChatDataQueryVariables = Exact<{
  fromDateTime?: string | null | undefined;
  reverse?: boolean | null | undefined;
}>;


export type GetChatDataQuery = { messages: Array<{ id: number, randomId: string | null, content: string, username: string | null, schema: string, type: number, json: string | null, createdAt: string, updatedAt: string, deletedAt: string | null, owner: { id: number, username: string | null, avatar: { id: number, s: { id: number, link: string } } | null } | null, poll: { isAnonymous: boolean, closedAt: string | null, messageId: number, question: string, allowMultiple: boolean, allowChangeVote: boolean, endsAt: string | null, isClosed: boolean, serverTime: string, selectedOptionIds: Array<number>, totalVotes: number | null, voters: Array<{ id: number, username: string, avatarUrl: string | null, votedAt: string | null, optionIds: Array<number> }>, options: Array<{ id: number, label: string, votes: number | null }> } | null, pictures: Array<{ m: { id: number, link: string, width: number, height: number }, o: { id: number, link: string, width: number, height: number } }>, deletedBy: { id: number, username: string | null } | null }>, lastMessages: Array<{ id: number }> };

export type GetCurrentUserQueryVariables = Exact<{ [key: string]: never; }>;


export type GetCurrentUserQuery = { getGrants: string, getCurrentUser: { id: number, username: string | null, email: string | null, emailConfirmed: boolean | null, createdAt: string, wasOnlineAt: string | null, avatar: { id: number, s: { id: number, height: number, width: number, link: string, size: number }, m: { id: number, height: number, width: number, link: string, size: number }, o: { id: number, height: number, width: number, link: string, size: number } } | null, roles: Array<{ id: number, name: string }> } };

export type GetGrantsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetGrantsQuery = { getGrants: string };

export type GetMessagesQueryVariables = Exact<{
  count?: number | null | undefined;
  page?: number | null | undefined;
  lastId?: number | null | undefined;
  fromDateTime?: string | null | undefined;
  reverse?: boolean | null | undefined;
  poll?: boolean | null | undefined;
}>;


export type GetMessagesQuery = { getMessages: Array<{ id: number, randomId: string | null, content: string, username: string | null, schema: string, type: number, json: string | null, createdAt: string, updatedAt: string, deletedAt: string | null, owner: { id: number, username: string | null, avatar: { id: number, s: { id: number, link: string } } | null } | null, poll: { isAnonymous: boolean, closedAt: string | null, messageId: number, question: string, allowMultiple: boolean, allowChangeVote: boolean, endsAt: string | null, isClosed: boolean, serverTime: string, selectedOptionIds: Array<number>, totalVotes: number | null, voters: Array<{ id: number, username: string, avatarUrl: string | null, votedAt: string | null, optionIds: Array<number> }>, options: Array<{ id: number, label: string, votes: number | null }> } | null, pictures: Array<{ m: { id: number, link: string, width: number, height: number }, o: { id: number, link: string, width: number, height: number } }>, deletedBy: { id: number, username: string | null } | null }> };

export type GetOnlineQueryVariables = Exact<{ [key: string]: never; }>;


export type GetOnlineQuery = { getOnline: Array<{ id: number, username: string | null, email: string | null, emailConfirmed: boolean | null, createdAt: string, wasOnlineAt: string | null, avatar: { id: number, s: { id: number, height: number, width: number, link: string, size: number }, m: { id: number, height: number, width: number, link: string, size: number }, o: { id: number, height: number, width: number, link: string, size: number } } | null, roles: Array<{ id: number, name: string }> }> };

export type GetPollQueryVariables = Exact<{
  messageId: number;
}>;


export type GetPollQuery = { getPoll: { isAnonymous: boolean, closedAt: string | null, messageId: number, question: string, allowMultiple: boolean, allowChangeVote: boolean, endsAt: string | null, isClosed: boolean, serverTime: string, selectedOptionIds: Array<number>, totalVotes: number | null, voters: Array<{ id: number, username: string, avatarUrl: string | null, votedAt: string | null, optionIds: Array<number> }>, options: Array<{ id: number, label: string, votes: number | null }> } };

export type GetUserByIdQueryVariables = Exact<{
  id: number;
}>;


export type GetUserByIdQuery = { getUserById: { id: number, username: string | null, email: string | null, emailConfirmed: boolean | null, createdAt: string, wasOnlineAt: string | null, avatar: { id: number, s: { id: number, height: number, width: number, link: string, size: number }, m: { id: number, height: number, width: number, link: string, size: number }, o: { id: number, height: number, width: number, link: string, size: number } } | null, roles: Array<{ id: number, name: string }> } };

export type GetVersionQueryVariables = Exact<{ [key: string]: never; }>;


export type GetVersionQuery = { version: string };

export type SearchUsersQueryVariables = Exact<{
  query: string;
}>;


export type SearchUsersQuery = { searchUsers: Array<{ id: number, username: string | null, email: string | null, emailConfirmed: boolean | null, createdAt: string, wasOnlineAt: string | null, avatar: { id: number, s: { id: number, height: number, width: number, link: string, size: number }, m: { id: number, height: number, width: number, link: string, size: number }, o: { id: number, height: number, width: number, link: string, size: number } } | null, roles: Array<{ id: number, name: string }> }> };

export type MessageCreatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type MessageCreatedSubscription = { messageCreated: { id: number, randomId: string | null, content: string, username: string | null, schema: string, type: number, json: string | null, createdAt: string, updatedAt: string, deletedAt: string | null, owner: { id: number, username: string | null, avatar: { id: number, s: { id: number, link: string } } | null } | null, poll: { isAnonymous: boolean, closedAt: string | null, messageId: number, question: string, allowMultiple: boolean, allowChangeVote: boolean, endsAt: string | null, isClosed: boolean, serverTime: string, selectedOptionIds: Array<number>, totalVotes: number | null, voters: Array<{ id: number, username: string, avatarUrl: string | null, votedAt: string | null, optionIds: Array<number> }>, options: Array<{ id: number, label: string, votes: number | null }> } | null, pictures: Array<{ m: { id: number, link: string, width: number, height: number }, o: { id: number, link: string, width: number, height: number } }>, deletedBy: { id: number, username: string | null } | null } };

export type MessageDeletedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type MessageDeletedSubscription = { messageDeleted: { id: number, randomId: string | null, content: string, username: string | null, schema: string, type: number, json: string | null, createdAt: string, updatedAt: string, deletedAt: string | null, owner: { id: number, username: string | null, avatar: { id: number, s: { id: number, link: string } } | null } | null, poll: { isAnonymous: boolean, closedAt: string | null, messageId: number, question: string, allowMultiple: boolean, allowChangeVote: boolean, endsAt: string | null, isClosed: boolean, serverTime: string, selectedOptionIds: Array<number>, totalVotes: number | null, voters: Array<{ id: number, username: string, avatarUrl: string | null, votedAt: string | null, optionIds: Array<number> }>, options: Array<{ id: number, label: string, votes: number | null }> } | null, pictures: Array<{ m: { id: number, link: string, width: number, height: number }, o: { id: number, link: string, width: number, height: number } }>, deletedBy: { id: number, username: string | null } | null } };

export type MessageUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type MessageUpdatedSubscription = { messageUpdated: { id: number, randomId: string | null, content: string, username: string | null, schema: string, type: number, json: string | null, createdAt: string, updatedAt: string, deletedAt: string | null, owner: { id: number, username: string | null, avatar: { id: number, s: { id: number, link: string } } | null } | null, poll: { isAnonymous: boolean, closedAt: string | null, messageId: number, question: string, allowMultiple: boolean, allowChangeVote: boolean, endsAt: string | null, isClosed: boolean, serverTime: string, selectedOptionIds: Array<number>, totalVotes: number | null, voters: Array<{ id: number, username: string, avatarUrl: string | null, votedAt: string | null, optionIds: Array<number> }>, options: Array<{ id: number, label: string, votes: number | null }> } | null, pictures: Array<{ m: { id: number, link: string, width: number, height: number }, o: { id: number, link: string, width: number, height: number } }>, deletedBy: { id: number, username: string | null } | null } };

export type OnlineUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type OnlineUpdatedSubscription = { onlineUpdated: Array<{ id: number, username: string | null, email: string | null, emailConfirmed: boolean | null, createdAt: string, wasOnlineAt: string | null, avatar: { id: number, s: { id: number, height: number, width: number, link: string, size: number }, m: { id: number, height: number, width: number, link: string, size: number }, o: { id: number, height: number, width: number, link: string, size: number } } | null, roles: Array<{ id: number, name: string }> }> };

export type UserUpdatedSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type UserUpdatedSubscription = { userUpdated: { id: number, username: string | null, email: string | null, emailConfirmed: boolean | null, createdAt: string, wasOnlineAt: string | null, avatar: { id: number, s: { id: number, height: number, width: number, link: string, size: number }, m: { id: number, height: number, width: number, link: string, size: number }, o: { id: number, height: number, width: number, link: string, size: number } } | null, roles: Array<{ id: number, name: string }> } };
