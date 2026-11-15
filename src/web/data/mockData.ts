/** Typed mock fixtures for the redesigned UI.
 *
 * Demo data only: the pages are not wired to the backend. Streaming chat and
 * daily summary generation are M1/M3 work. Timestamps are generated relative
 * to "now" so the calendar always shows recent activity, and every local day
 * key is derived from the actual timestamps, so grouping stays consistent.
 */

import { JOURNAL_TIMEZONE, localDayKey } from '../lib/calendar';
import type { Conversation, DaySummary, Message } from '../types';

export interface MockJournal {
  conversations: Conversation[];
  messagesByConversation: Record<string, Message[]>;
  /** Keyed by local day key (YYYY-MM-DD). */
  daySummaries: Record<string, DaySummary>;
}

interface FixtureMessage {
  role: 'user' | 'assistant';
  content: string;
  source?: 'text' | 'voice';
  hoursAgo: number;
}

interface FixtureConversation {
  id: string;
  title: string;
  messages: FixtureMessage[];
}

interface FixtureSummary {
  /** Any timestamp inside the summarized local day. */
  hoursAgo: number;
  topics: string[];
  summary: string;
}

function isoHoursAgo(hours: number): string {
  const now = Date.now();
  const today = localDayKey(new Date(now).toISOString(), JOURNAL_TIMEZONE);
  const offset = hours < 5 ? 0 : hours < 30 ? 1 : hours < 100 ? 3 : 12;
  // UTC midnight is 10/11am Melbourne, safely away from DST/day boundaries.
  const anchor = Date.parse(`${today}T00:00:00Z`) - offset * 86_400_000;
  return new Date(Math.min(anchor, now) - (hours % 24) * 1000).toISOString();
}

const fixtureConversations: FixtureConversation[] = [
  {
    id: 'conv-morning',
    title: 'Morning check-in & focus plan',
    messages: [
      {
        role: 'user',
        hoursAgo: 3.4,
        content:
          'Morning! My day is packed — standup at 10, then interviews from 2. When can I fit a deep-work block for the Starward UI redesign?',
      },
      {
        role: 'assistant',
        hoursAgo: 3.3,
        content:
          'Morning! With standup at 10 and interviews from 14:00, the cleanest window is **11:30–13:00** — right after standup, before the interviews.\n\n- Block it in your calendar now; mornings get eaten by pings\n- Structure first, polish later\n\nWant a mini checklist for the 90 minutes?',
      },
      {
        role: 'user',
        hoursAgo: 3.1,
        content: 'Yes please. I get distracted easily once I open Slack.',
      },
      {
        role: 'assistant',
        hoursAgo: 3,
        content:
          'Here you go:\n\n- **0–10 min** — close Slack and mail, write the one outcome for the block\n- **10–70 min** — build the layout with breakpoints; no color picking yet\n- **70–90 min** — note what broke, screenshot the result\n\nThe rule that helps most: if you context-switch, write down the next action *before* you switch.',
      },
    ],
  },
  {
    id: 'conv-dinner',
    title: 'Dinner party portions',
    messages: [
      {
        role: 'user',
        source: 'voice',
        hoursAgo: 1.8,
        content:
          'Hey, for Saturday — I am making 红烧肉 for eight people instead of four. How should I adjust the sugar and the cooking time?',
      },
      {
        role: 'assistant',
        hoursAgo: 1.7,
        content:
          'Scaling 红烧肉 from four to eight:\n\n- **Sugar**: from ~30g to ~55g — scale slightly under linear; the reduction concentrates sweetness\n- **Braising time**: about 20% longer, not double; a wider pot evens out\n- **Liquid**: double it, keep the pork just covered\n\nBrown in two batches so the meat sears instead of steaming. 祝周六愉快！',
      },
      { role: 'user', hoursAgo: 1.5, content: 'Should I use rock sugar or regular?' },
      {
        role: 'assistant',
        hoursAgo: 1.4,
        content:
          'Rock sugar (冰糖) gives a glossier, smoother finish — that is the traditional choice.\n\nRegular sugar works, but it caramelizes faster and can go bitter. If that is all you have, add it with a splash of hot water and stir off the heat.',
      },
    ],
  },
  {
    id: 'conv-career',
    title: 'Career switch timeline',
    messages: [
      {
        role: 'user',
        hoursAgo: 26.5,
        content:
          'I keep going back and forth on switching from backend to ML engineering. Is a 6-month timeline realistic while working full time?',
      },
      {
        role: 'assistant',
        hoursAgo: 26.3,
        content:
          'Honest take: 6 months is **tight but possible** if the switch keeps you close to backend.\n\n- Months 1–2: Python plus the math you actually use daily (linear algebra, gradients)\n- Months 3–4: train small models end-to-end; one tabular and one tiny NLP project\n- Months 5–6: ship a deployed inference API — that is your interview story\n\nThe trap is coursework-only months. Every month should end with something runnable.',
      },
      {
        role: 'user',
        hoursAgo: 26,
        content: 'What about the systems design interviews? I hear ML system design is different.',
      },
      {
        role: 'assistant',
        hoursAgo: 25.8,
        content:
          'It is, but your backend background is an advantage:\n\n- Feature stores, batch vs streaming features, training/serving skew — half of these are data plumbing you already know\n- Practice the classic loops: recsys ranking, feed ranking, fraud detection\n\nYou mostly need vocabulary plus a few patterns, not a PhD.',
      },
      {
        role: 'user',
        hoursAgo: 25.6,
        content: 'OK, that is less scary. I will block Sunday mornings for the math catch-up.',
      },
      {
        role: 'assistant',
        hoursAgo: 25.5,
        content:
          'Sunday mornings are a good slot — fresh brain, low interruption risk.\n\nStart with the matrix chapters of the book you already own and skip proofs on the first pass. When you hit backprop confusion, come back — it is the standard wall and very climbable.',
      },
    ],
  },
  {
    id: 'conv-sleep',
    title: 'Quick sleep question',
    messages: [
      {
        role: 'user',
        hoursAgo: 21.5,
        content: 'Is reading in bed before sleep actually bad if it is a paper book?',
      },
      {
        role: 'assistant',
        hoursAgo: 21.4,
        content:
          "Paper books are fine — the 'no reading in bed' advice targets screens and *engagement spirals*.\n\n- Keep it boring-ish; a thriller that forces one more chapter is the real risk\n- Dim, warm light helps\n\nIf you fall asleep mid-page, that is a feature.",
      },
    ],
  },
  {
    id: 'conv-fitness',
    title: '健身与下周计划',
    messages: [
      {
        role: 'user',
        hoursAgo: 70,
        content: '下周想开始跑步，每周三次，帮我排一个计划，我是新手。',
      },
      {
        role: 'assistant',
        hoursAgo: 69.9,
        content:
          '新手每周三次可以这样排：\n\n- **周二**：跑走交替 20 分钟（跑 2 分走 1 分）\n- **周四**：轻松跑 15 分钟，标准是能边跑边说话\n- **周日**：30 分钟快走或跑走交替\n\n前四周别加距离，先让膝盖和跟腱适应。跑前动态热身，跑后慢走 5 分钟。',
      },
      { role: 'user', hoursAgo: 69.6, content: '鞋子需要专门买跑鞋吗？平时的运动鞋行不行？' },
      {
        role: 'assistant',
        hoursAgo: 69.5,
        content:
          '值得买一双真跑鞋。\n\n- 跑鞋的缓震和落差是按跑步冲击设计的，普通运动鞋偏向侧向支撑\n- 去店里试穿，傍晚去——那时脚最胀，更接近跑步时的状态\n\n预算内先买舒适的，不用追顶配。周日练完把下周三次放进行事历。',
      },
    ],
  },
  {
    id: 'conv-books',
    title: 'Reading notes: Deep Work',
    messages: [
      {
        role: 'user',
        hoursAgo: 292,
        content: 'Finished Deep Work. One habit from it I can actually keep?',
      },
      {
        role: 'assistant',
        hoursAgo: 291.9,
        content:
          "Keep the **shutdown ritual**.\n\nAt day's end, review open loops, write tomorrow's first task, then say your stop phrase out loud. It sounds silly; it is the cheapest way to stop work leaking into your evening.\n\nYou already block time — this closes the loop on the other end.",
      },
    ],
  },
];

const fixtureSummaries: FixtureSummary[] = [
  {
    hoursAgo: 2,
    topics: ['focus', 'cooking', '红烧肉'],
    summary: 'Across two chats, you explored finding a focused work block and preparing 红烧肉 for eight guests. You mentioned a busy day and getting distracted by Slack. The assistant suggested a short preparation ritual and a structure-first work session; those are suggestions rather than completed actions.\n\nIn the cooking chat, you asked about scaling sugar, braising time, and choosing rock sugar. The assistant offered portion adjustments and recommended browning in batches. These are demo suggestions, not verified recipe results.',
  },
  {
    hoursAgo: 26,
    topics: ['career switch', 'interview prep', 'sleep'],
    summary:
      "Two conversations today. The main one worked through switching from backend to ML engineering: you settled on a 6-month timeline as tight but possible, mapped month-by-month milestones — math catch-up first, one runnable project per month — and planned Sunday-morning study blocks. ML system design felt less scary once framed as vocabulary plus a few patterns rather than a PhD.\n\nA second, short exchange settled that reading paper books in bed is fine; the real sleep risk is page-turner momentum, not the medium.\n\n*Marked as AI suggestions to verify: the month-by-month pacing came from the assistant, not your own experience.*",
  },
  {
    hoursAgo: 70,
    topics: ['跑步计划', '跑鞋'],
    summary:
      '你今天开始规划跑步训练。主要的一条对话排出了新手每周三次的计划：周二跑走交替、周四轻松跑、周日快走，前四周不加距离，先让膝盖和跟腱适应。\n\n另一条问答确定了要买真正的跑鞋，并且傍晚去试穿最合适——那时脚最胀，最接近跑步时的状态。\n\n*标注：训练节奏（前四周不加距离）是 AI 建议而非你的经验，如有膝盖不适请自行调整。*',
  },
  {
    hoursAgo: 292,
    topics: ['deep work', 'habits'],
    summary:
      "A single, short conversation today: finishing *Deep Work* and picking one habit to keep. You landed on the shutdown ritual — reviewing open loops, writing tomorrow's first task, and a stop phrase — as the cheapest change that stops work bleeding into evenings.",
  },
];

/** Simulated assistant replies, rotated per send. Demo text only. */
export const MOCK_REPLIES: string[] = [
  'Good question. Thinking it through:\n\n- The smallest useful first step is usually the one you can finish this week\n- Write down what "done" looks like before starting\n- Park the polish — it multiplies effort silently\n\nWant me to expand any of these?',
  "Here's my honest take.\n\nMost of the time the blocker is not information — it is that the next *specific* action is undefined. Pick the ten-minute version of the next step and do it before you close the tab.\n\nIf it is still stuck after that, tell me what surprised you.",
  '让我想想。\n\n- 先把目标写下来，一句话就够\n- 拆成能在 30 分钟内完成的块\n- 记下每次卡住的地方——那通常是真正的难点\n\n想先从哪一块开始？',
  'A few angles:\n\n- **Constraints first** — what is fixed (time, budget, people)?\n- **Reversibility** — prefer choices you can undo cheaply\n- **Feedback speed** — whichever option tells you sooner that it is wrong wins\n\nWhich constraint is tightest right now?',
];

function findLastMessageAt(
  messagesByConversation: Record<string, Message[]>,
  dateKey: string
): string | undefined {
  let latest: string | undefined;
  for (const messages of Object.values(messagesByConversation)) {
    for (const message of messages) {
      if (message.role === 'assistant' && message.status !== 'complete') {
        continue;
      }
      if (localDayKey(message.createdAt, JOURNAL_TIMEZONE) !== dateKey) {
        continue;
      }
      if (!latest || message.createdAt > latest) {
        latest = message.createdAt;
      }
    }
  }
  return latest;
}

/** Build the mock journal. Timestamps are relative to "now", so the calendar
 * always has recent activity and day keys always match the actual times. */
export function createMockJournal(): MockJournal {
  const messagesByConversation: Record<string, Message[]> = {};
  const conversations: Conversation[] = fixtureConversations.map((fixture) => {
    const messages: Message[] = fixture.messages.map((fixtureMessage, index) => ({
      id: `${fixture.id}-msg-${index + 1}`,
      conversationId: fixture.id,
      sequence: index + 1,
      role: fixtureMessage.role,
      content: fixtureMessage.content,
      source: fixtureMessage.role === 'assistant' ? 'model' : (fixtureMessage.source ?? 'text'),
      status: 'complete',
      createdAt: isoHoursAgo(fixtureMessage.hoursAgo),
    }));
    messagesByConversation[fixture.id] = messages;
    return {
      id: fixture.id,
      title: fixture.title,
      createdAt: messages[0].createdAt,
      updatedAt: messages[messages.length - 1].createdAt,
    };
  });

  const daySummaries: Record<string, DaySummary> = {};
  for (const fixtureSummary of fixtureSummaries) {
    const dateKey = localDayKey(isoHoursAgo(fixtureSummary.hoursAgo), JOURNAL_TIMEZONE);
    const lastMessageAt = findLastMessageAt(messagesByConversation, dateKey);
    if (!lastMessageAt) {
      continue; // Nothing summarized that day (e.g. clock edge) — skip cleanly.
    }
    // Generated just after the day's last message; the cutoff matches.
    const generatedAt = new Date(Date.parse(lastMessageAt) + 5 * 60_000).toISOString();
    daySummaries[dateKey] = {
      date: dateKey,
      topics: fixtureSummary.topics,
      summary: fixtureSummary.summary,
      generatedAt,
      cutoff: generatedAt,
    };
  }

  return { conversations, messagesByConversation, daySummaries };
}