// Type declarations for claude-code-cli

export interface SetupResult {
  claudeDir: boolean;
  settings: boolean;
  apiKey: boolean;
  binary: boolean;
}

export interface SessionInfo {
  name: string;
  path: string;
  lastModified: string | null;
  fileCount: number;
  sizeBytes: number;
}

export interface KeyCheckResult {
  environment: {
    set: boolean;
    valid: boolean;
    masked: string | null;
    source: string;
    format?: string;
  };
  shellProfiles: string[];
  dotEnvFiles: string[];
  recommendations: string[];
}

export interface DoctorCheck {
  status: 'ok' | 'warn' | 'error';
  message: string;
}

export interface DoctorResult {
  node: DoctorCheck;
  platform: DoctorCheck;
  claudeDir: DoctorCheck;
  settings: DoctorCheck;
  environment: Array<DoctorCheck & { name: string }>;
  git: DoctorCheck;
  npm: DoctorCheck;
  disk: DoctorCheck;
}

export function runSetup(jsonMode?: boolean): SetupResult;
export function listSessions(jsonMode?: boolean, opts?: object): SessionInfo[];
export function cleanSessions(dryRun?: boolean): void;
export function runKeysCheck(jsonMode?: boolean): KeyCheckResult;
export function runDoctor(jsonMode?: boolean): DoctorResult;
