// Predefined "toegestane hulpmiddelen" texts. The user can pick one of these as a
// starting point and then freely edit the text. Wording is taken from the
// reference exam covers in /examples. The Lockdownbrowser variant is the default.
export interface AllowedResourcesPreset {
  id: string;
  title: string;
  text: string;
}

export const ALLOWED_RESOURCES_PRESETS: AllowedResourcesPreset[] = [
  {
    id: 'lockdown',
    title: 'Lockdownbrowser-examen',
    text: 'Blackboard Lockdownbrowser op laptop, documentatie zoals ingesteld/toegestaan via Lockdownbrowser, geen papier, enkel examen op laptop, GEEN Internet, GEEN AI tools',
  },
  {
    id: 'blackboard',
    title: 'Blackboard-examen (geen lockdown)',
    text: 'Blackboard, alles digitaal op laptop, GEEN Internet, GEEN AI tools',
  },
];

export const DEFAULT_ALLOWED_RESOURCES = ALLOWED_RESOURCES_PRESETS[0].text;
