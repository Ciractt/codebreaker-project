import 'server-only';
import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Participant sessions.
 *
 * A participant is not authenticated — email is a progress key, not a
 * credential. The cookie exists so that returning to the site on the same
 * device restores progress without retyping. It is signed so the id cannot be
 * swapped for someone else's, and httpOnly so client script can't read it.
 */

const COOKIE = 'cb_participant';
const MAX_AGE = 60 * 60 * 24 * 45;

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 16) {
    throw new Error('SESSION_SECRET is missing or too short (need 16+ chars).');
  }
  return value;
}

function sign(participantId: string): string {
  return createHmac('sha256', secret()).update(participantId).digest('base64url');
}

function verify(participantId: string, signature: string): boolean {
  const expected = Buffer.from(sign(participantId));
  const given = Buffer.from(signature);
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

export async function readSession(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw) return null;

  const separator = raw.lastIndexOf('.');
  if (separator < 1) return null;

  const participantId = raw.slice(0, separator);
  const signature = raw.slice(separator + 1);

  if (!verify(participantId, signature)) return null;
  return participantId;
}

export async function writeSession(participantId: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, `${participantId}.${sign(participantId)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export function newParticipantId(): string {
  return randomUUID();
}
