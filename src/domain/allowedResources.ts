import type { Language } from './types';

export interface AllowedResourcesPreset {
  id: string;
  title: string;
  text: string;
  language: Language;
}

export const ALLOWED_RESOURCES_PRESETS: AllowedResourcesPreset[] = [
  {
    id: 'lockdown_nl',
    title: 'Lockdownbrowser-examen',
    text: 'Blackboard Lockdownbrowser op laptop, documentatie zoals ingesteld/toegestaan via Lockdownbrowser, geen papier, enkel examen op laptop, GEEN Internet, GEEN AI tools',
    language: 'nl',
  },
  {
    id: 'blackboard_nl',
    title: 'Blackboard-examen (geen lockdown)',
    text: 'Blackboard, alles digitaal op laptop, GEEN Internet, GEEN AI tools',
    language: 'nl',
  },
  {
    id: 'lockdown_en',
    title: 'Lockdownbrowser exam',
    text: 'Blackboard LockDown Browser on laptop, documentation as configured/allowed via LockDown Browser, no paper, exam on laptop only, NO Internet access, NO AI tools',
    language: 'en',
  },
  {
    id: 'blackboard_en',
    title: 'Blackboard exam (no lockdown)',
    text: 'Blackboard, everything digital on laptop, NO Internet access, NO AI tools',
    language: 'en',
  },
];

export const DEFAULT_ALLOWED_RESOURCES = ALLOWED_RESOURCES_PRESETS[0].text;
export const DEFAULT_ALLOWED_RESOURCES_EN = ALLOWED_RESOURCES_PRESETS[2].text;
