import type { DuoIconName } from '@/components/DuoIcon';

export type CircadianPhase = 'morning' | 'midday' | 'evening' | 'night';

export interface CircadianConfig {
  phase: CircadianPhase;
  label: string;
  timeRange: string;
  scienceCitation: string;
  scienceDetail: string;
  iconName: DuoIconName;
  prompts: string[];
}

export const CIRCADIAN_DATA: Record<CircadianPhase, CircadianConfig> = {
  morning: {
    phase: 'morning',
    label: 'Morning Priming',
    timeRange: '5:00 AM – 11:59 AM',
    scienceCitation: 'Gollwitzer Implementation Protocol (Stanford/NYU)',
    scienceDetail: 'Priming prefrontal executive focus and preempting friction during peak cortisol awakening.',
    iconName: 'sun',
    prompts: [
      'What is the single non-negotiable win for my day today?',
      'Where do I anticipate friction or resistance today, and how will I respond?',
      'What emotional tone and energy do I want to bring to my work today?',
      'What intention can I set to stay grounded if pressure escalates today?',
    ],
  },
  midday: {
    phase: 'midday',
    label: 'Midday Reset',
    timeRange: '12:00 PM – 4:59 PM',
    scienceCitation: 'Harvard 22.8% Reflection Protocol (HBS)',
    scienceDetail: 'Harvard field research shows 15 minutes of deliberate midday reflection boosts learning & efficacy by 23%.',
    iconName: 'compass',
    prompts: [
      'What unexpected friction or obstacle drained my energy this morning?',
      'What worked surprisingly well that I should double down on this afternoon?',
      'Pause the autopilot: what is the most high-leverage task for my remaining hours?',
      'Am I focusing on what genuinely matters, or just reacting to noise?',
    ],
  },
  evening: {
    phase: 'evening',
    label: 'Evening Decompression',
    timeRange: '5:00 PM – 9:59 PM',
    scienceCitation: 'Baylor & NIH Sleep-Onset Protocol (JEP: General)',
    scienceDetail: 'Writing down unclosed cognitive loops offloads working memory and significantly cuts sleep-onset latency.',
    iconName: 'lamp-2',
    prompts: [
      'What uncompleted loop is my brain still chewing on that I can park here?',
      'What was one quiet, meaningful moment or win from today?',
      'What lesson did today teach me that my future self should remember?',
      'What can I consciously let go of before transitioning into personal time?',
    ],
  },
  night: {
    phase: 'night',
    label: 'Late-Night Solitude',
    timeRange: '10:00 PM – 4:59 AM',
    scienceCitation: 'Pennebaker Expressive Protocol (Harvard/UT)',
    scienceDetail: 'Expressive writing during reduced late-night inhibition provides emotional release and nervous system downregulation.',
    iconName: 'moon-stars',
    prompts: [
      'Offload the restless thoughts keeping my mind spinning tonight.',
      'What went unsaid or unresolved today that needs a private, safe space?',
      'Give yourself grace: what did you handle well today despite the difficulty?',
      'Free-write: express whatever is in your headspace without filtering.',
    ],
  },
};

export const CIRCADIAN_ALTERNATES: Record<CircadianPhase, string[][]> = {
  morning: [
    [
      'What is one small thing I can do this morning that my evening self will thank me for?',
      'What mental story or doubt am I carrying into today, and is it actually true?',
      'If I had only 2 hours of deep focus today, what would I protect above all else?',
      'What intention or attitude will best serve me if unexpected disruptions occur?',
    ],
    [
      'What does showing up as my most authentic, grounded self look like before noon?',
      'What physical sensation or tension is present in my body right now as I wake?',
      'What is one low-value distraction I promise to proactively ignore today?',
      'What curiosity or creative spark am I looking forward to exploring today?',
    ],
  ],
  midday: [
    [
      'What is one decision I made this morning that I can now stop ruminating on?',
      'How has my physical energy shifted since morning, and what does my body need?',
      'If I re-scoped my afternoon down to 1 single essential priority, what is it?',
      'What boundary do I need to hold for the next 4 hours to protect my mental clarity?',
    ],
    [
      'Where did I notice unnecessary urgency creep in today, and how can I slow down?',
      'What small victory or positive moment happened so far that I glossed over?',
      'Take a deep breath: what thought pattern is currently creating cognitive friction?',
      'Am I giving my best energy to what matters, or whatever screamed the loudest?',
    ],
  ],
  evening: [
    [
      'What conversation or moment from today is still lingering in my thoughts?',
      'What was the most challenging situation today, and what inner strength did I rely on?',
      'Close the mental tabs: what 3 items belong on tomorrow\'s list so tonight is free?',
      'What is one quiet joy or moment of beauty I noticed today?',
    ],
    [
      'If today had a honest headline, what would it be and why?',
      'What expectation of myself did I hold today that was unreasonably demanding?',
      'How can I deliberately shift from "doing" mode into restorative "being" mode tonight?',
      'What can I thank myself for having navigated today?',
    ],
  ],
  night: [
    [
      'What worry or repetitive thought is keeping my mind active that I can release here?',
      'Write down the raw, unedited truth of how today felt in your own words.',
      'What would kind, unconditional compassion say to the exhausted parts of me?',
      'Release the urge to fix tomorrow: what can wait until the morning light?',
    ],
    [
      'What emotional weight did I carry today that was heavier than I admitted to anyone?',
      'If my mind could rest inside one comforting, peaceful truth tonight, what would it be?',
      'Forgive yourself for what was left unfinished today: what can you let rest?',
      'What does true stillness and deep restorative rest look like for me tonight?',
    ],
  ],
};

export function getAlternatePrompts(phase: CircadianPhase, currentPrompts?: string[]): string[] {
  const pools = CIRCADIAN_ALTERNATES[phase] || [];
  if (pools.length === 0) return CIRCADIAN_DATA[phase].prompts;

  // Filter out any pool that closely matches the current prompts
  const firstCurrent = currentPrompts?.[0]?.toLowerCase();
  for (const pool of pools) {
    if (!firstCurrent || pool[0]?.toLowerCase() !== firstCurrent) {
      return pool;
    }
  }
  // Default to the first alternate or base prompts
  return pools[0] || CIRCADIAN_DATA[phase].prompts;
}

export function detectCircadianPhase(date: Date = new Date()): CircadianPhase {
  const hours = date.getHours();
  if (hours >= 5 && hours < 12) {
    return 'morning';
  } else if (hours >= 12 && hours < 17) {
    return 'midday';
  } else if (hours >= 17 && hours < 22) {
    return 'evening';
  } else {
    return 'night';
  }
}

export function getCircadianConfig(overridePhase?: CircadianPhase, date: Date = new Date()): CircadianConfig {
  const activePhase = overridePhase || detectCircadianPhase(date);
  return CIRCADIAN_DATA[activePhase];
}

