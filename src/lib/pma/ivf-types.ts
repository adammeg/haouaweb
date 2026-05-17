/** Profil PMA collecté (équivalent ivfCollectProfile v50). */
export interface IvfPatientProfile {
  age: number | null;
  bmi: number | null;
  dureeInf: number | null;
  typeInf: string;
  cause: string;
  indication: string;
  sopk: string;
  endo: string;
  chirOv: string;
  uterin: string;
  trompes: string;
  ohssAtcd: string;
  ageH: number | null;
  spermo: string;
  spermoConc: number | null;
  spermoMob: number | null;
  spermoMorph: number | null;
  dfi: number | null;
  amh: number | null;
  afc: number | null;
  volD: number | null;
  volG: number | null;
  access: string;
  endoQual: string;
  fsh: number | null;
  lh: number | null;
  e2: number | null;
  prog: number | null;
  prl: number | null;
  tsh: number | null;
  testo: number | null;
  dheas: number | null;
  oh17: number | null;
  insulin: number | null;
  glyc: number | null;
  prevCycles: number;
  prevOocytes: number | null;
  prevEmbryons: number | null;
  embryoQual: string;
  implFail: number;
  prevDose: number | null;
  prevProtocol: string;
  prevResult: string;
  historyNotes: string;
}

export interface PoseidonResult {
  group: number;
  desc: string;
  subgroup: string | null;
  lowReserve: boolean;
  adequateReserve: boolean;
  poorPrevResponse: boolean;
}

export interface BolognaResult {
  positive: boolean;
  criteria: number;
  details: string[];
  extremePor: boolean;
}

export interface OvarianResponseResult {
  responseType: string;
  expectedOocytes: number | null;
  ohssRisk: string;
  prognosis: number | null;
}

export interface OhssRiskResult {
  score: number;
  level: string;
  label: string;
  strategy: string;
  factors: string[];
}

export interface IvfProtocolOption {
  id: string;
  icon: string;
  name: string;
  type: string;
  dose: number;
  trigger: string;
  strategy: string;
  meds: string[];
  pros: string;
  cons: string;
  indication: string;
  freezeAll: boolean;
  ohssStrategy: string | null;
  recommended?: boolean;
}

export interface IvfCalendarDay {
  day: string;
  type: string;
  title: string;
  detail: string;
  tags: string[];
}

export interface IvfAnalysis {
  id: string;
  patientId: string;
  poseidon: PoseidonResult;
  bologna: BolognaResult;
  response: OvarianResponseResult;
  ohss: OhssRiskResult;
  protocols: IvfProtocolOption[];
  calendar: IvfCalendarDay[];
  explanation: string;
  selectedProtocolId?: string;
  createdAt: string;
}

export const EMPTY_IVF_PROFILE: IvfPatientProfile = {
  age: null,
  bmi: null,
  dureeInf: null,
  typeInf: "",
  cause: "",
  indication: "",
  sopk: "non",
  endo: "non",
  chirOv: "non",
  uterin: "normal",
  trompes: "permeables",
  ohssAtcd: "non",
  ageH: null,
  spermo: "normal",
  spermoConc: null,
  spermoMob: null,
  spermoMorph: null,
  dfi: null,
  amh: null,
  afc: null,
  volD: null,
  volG: null,
  access: "bilateral",
  endoQual: "normal",
  fsh: null,
  lh: null,
  e2: null,
  prog: null,
  prl: null,
  tsh: null,
  testo: null,
  dheas: null,
  oh17: null,
  insulin: null,
  glyc: null,
  prevCycles: 0,
  prevOocytes: null,
  prevEmbryons: null,
  embryoQual: "",
  implFail: 0,
  prevDose: null,
  prevProtocol: "",
  prevResult: "",
  historyNotes: "",
};
