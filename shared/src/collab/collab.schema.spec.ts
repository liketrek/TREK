import {
  collabNoteCreateRequestSchema,
  collabPollCreateRequestSchema,
  collabPollVoteRequestSchema,
  collabMessageCreateRequestSchema,
  collabReactionRequestSchema,
} from './collab.schema';

import { describe, it, expect } from 'vitest';

describe('collabNoteCreateRequestSchema', () => {
  it('requires a non-empty title; the rest is optional', () => {
    expect(collabNoteCreateRequestSchema.safeParse({ title: 'Idea' }).success).toBe(true);
    expect(collabNoteCreateRequestSchema.safeParse({ title: '' }).success).toBe(false);
    expect(collabNoteCreateRequestSchema.safeParse({}).success).toBe(false);
  });
});

describe('collabPollCreateRequestSchema', () => {
  it('requires a question and at least two options', () => {
    expect(
      collabPollCreateRequestSchema.safeParse({
        question: 'Where?',
        options: ['A', 'B'],
      }).success,
    ).toBe(true);
    expect(
      collabPollCreateRequestSchema.safeParse({
        question: 'Where?',
        options: ['A'],
      }).success,
    ).toBe(false);
    expect(collabPollCreateRequestSchema.safeParse({ options: ['A', 'B'] }).success).toBe(false);
  });
});

describe('collabPollVoteRequestSchema', () => {
  it('requires a numeric option_index', () => {
    expect(collabPollVoteRequestSchema.safeParse({ option_index: 0 }).success).toBe(true);
    expect(collabPollVoteRequestSchema.safeParse({ option_index: 'a' }).success).toBe(false);
  });
});

describe('collabMessageCreateRequestSchema', () => {
  it('requires text, caps it at 5000, allows a nullable reply_to', () => {
    expect(collabMessageCreateRequestSchema.safeParse({ text: 'hi', reply_to: null }).success).toBe(true);
    expect(collabMessageCreateRequestSchema.safeParse({ text: 'hi', reply_to: 4 }).success).toBe(true);
    expect(collabMessageCreateRequestSchema.safeParse({ text: '' }).success).toBe(false);
    expect(collabMessageCreateRequestSchema.safeParse({ text: 'x'.repeat(5001) }).success).toBe(false);
  });
});

describe('collabReactionRequestSchema', () => {
  it('requires a non-empty emoji', () => {
    expect(collabReactionRequestSchema.safeParse({ emoji: '👍' }).success).toBe(true);
    expect(collabReactionRequestSchema.safeParse({ emoji: '' }).success).toBe(false);
  });
});
