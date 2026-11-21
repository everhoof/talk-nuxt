interface MessageIdentity {
  id: number;
  randomId?: string | null;
  state?: string;
  updatedAt?: string;
  updatedAtMillis?: number;
  deletedAt?: string | null;
  poll?: { serverTime: string } | null;
}

function timestamp(message: MessageIdentity): number {
  return message.updatedAtMillis ?? (Date.parse(message.updatedAt ?? '') || 0);
}

function freshest<T extends MessageIdentity>(current: T, incoming: T): T {
  // Client clocks must not make an optimistic copy newer than its server acknowledgement.
  if (current.state === 'SENT' && incoming.state !== 'SENT') return incoming;
  if (incoming.state === 'SENT' && current.state !== 'SENT') return current;
  const currentDeleted = !!current.deletedAt;
  const incomingDeleted = !!incoming.deletedAt;
  const keepCurrent = (currentDeleted && !incomingDeleted)
    || (currentDeleted === incomingDeleted && timestamp(incoming) < timestamp(current));
  const base = keepCurrent ? current : incoming;
  // Votes can change without changing the message's updatedAt timestamp.
  let poll = current.poll;
  if (!poll || (incoming.poll && Date.parse(incoming.poll.serverTime) >= Date.parse(poll.serverTime))) {
    poll = incoming.poll;
  }
  if (!poll || base.poll === poll) return base;
  return Object.assign(Object.create(Object.getPrototypeOf(base)), base, { poll }) as T;
}

export function mergeMessages<T extends MessageIdentity>(
  current: readonly T[],
  incoming: readonly T[],
  placement: 'start' | 'end' = 'start',
): T[] {
  interface Slot {
    message: T;
    rank: number;
    removed: boolean;
    ids: Set<number>;
    randomIds: Set<string>;
  }
  const byId = new Map<number, Slot>();
  const byRandomId = new Map<string, Slot>();
  const existing: Slot[] = [];
  const added: Slot[] = [];

  function upsert(message: T, slots: Slot[], rank: number) {
    const idMatch = byId.get(message.id);
    const randomMatch = message.randomId ? byRandomId.get(message.randomId) : undefined;
    let slot = idMatch ?? randomMatch;
    if (idMatch && randomMatch && idMatch !== randomMatch) {
      // Acknowledgements can bridge a server row and an optimistic row.
      slot = idMatch.rank < randomMatch.rank ? idMatch : randomMatch;
      const duplicate = slot === idMatch ? randomMatch : idMatch;
      slot.message = freshest(slot.message, duplicate.message);
      duplicate.removed = true;
      for (const id of duplicate.ids) {
        byId.set(id, slot);
        slot.ids.add(id);
      }
      for (const id of duplicate.randomIds) {
        byRandomId.set(id, slot);
        slot.randomIds.add(id);
      }
    }
    if (slot) {
      slot.message = freshest(slot.message, message);
    } else {
      slot = {
        message, rank, removed: false, ids: new Set(), randomIds: new Set(),
      };
      slots.push(slot);
    }
    slot.ids.add(message.id);
    byId.set(message.id, slot);
    if (message.randomId) {
      slot.randomIds.add(message.randomId);
      byRandomId.set(message.randomId, slot);
    }
  }

  current.forEach((message, index) => upsert(message, existing, placement === 'start' ? incoming.length + index : index));
  incoming.forEach((message, index) => upsert(message, added, placement === 'start' ? index : current.length + index));
  const slots = placement === 'start' ? [...added, ...existing] : [...existing, ...added];
  return slots.filter((slot) => !slot.removed).map((slot) => slot.message);
}
