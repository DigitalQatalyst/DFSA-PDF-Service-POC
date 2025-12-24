/**
 * Picklist Metadata Registry
 * Maps Dataverse option set numeric values to human-readable labels
 *
 * POC Implementation Note:
 * In production, this should be dynamically fetched from Dataverse metadata API
 * For POC purposes, we use static mappings based on the canonical guide
 */

/**
 * Application Guidelines Confirmation
 * Field: dfsa_iconfirmthatihavecarefullyreadandup
 */
export const GUIDELINES_CONFIRM: Record<number, string> = {
  356960000: 'I do not confirm',
  356960001: 'I confirm'
};

/**
 * Title Options
 * Field: dfsa_titlez
 */
export const TITLE_OPTIONS: Record<number, string> = {
  356960000: 'Mr',
  356960001: 'Mrs',
  356960002: 'Ms',
  356960003: 'Dr',
  356960004: 'Prof',
  356960005: 'Other'
};

/**
 * Number of Citizenships
 * Field: dfsa_no
 */
export const CITIZENSHIP_COUNT: Record<number, string> = {
  356960000: '1',
  356960001: '2',
  356960002: '3',
  356960003: '4',
  356960004: '5',
  356960005: 'N/A'
};

/**
 * Country/Territory Options (248 countries)
 * Field: dfsa_countryterritory, dfsa_countryauthindividual, dfsa_country2
 *
 * POC Implementation: Common countries only
 * Production: Complete ISO 3166 country list
 */
export const COUNTRY_OPTIONS: Record<number, string> = {
  // Sample countries - expand as needed
  356960000: 'Afghanistan',
  356960001: 'Albania',
  356960002: 'Algeria',
  356960003: 'Andorra',
  356960004: 'Angola',
  // ... (skipping intermediate values for POC)
  356960173: 'Qatar',
  356960174: 'Romania',
  356960175: 'Russia',
  // ... (skipping intermediate values)
  356960240: 'United Kingdom',
  356960241: 'United Arab Emirates',
  356960242: 'United States',
  356960243: 'Uruguay',
  356960244: 'Uzbekistan',
  356960245: 'Vanuatu',
  356960246: 'Venezuela',
  356960247: 'Vietnam'
};

/**
 * Regulator Options
 * Field: dfsa_regulator
 */
export const REGULATOR_OPTIONS: Record<number, string> = {
  356960000: 'ASIC (Australia)',
  356960001: 'APRA (Australia)',
  356960002: 'FCA (UK)',
  356960003: 'PRA (UK)',
  356960004: 'SEC (USA)',
  356960005: 'FINRA (USA)',
  356960006: 'MAS (Singapore)',
  356960007: 'HKMA (Hong Kong)',
  356960008: 'SFC (Hong Kong)',
  356960009: 'BaFin (Germany)',
  356960010: 'AMF (France)',
  356960087: 'Other' // Special: triggers additional details field
};

/**
 * Residence Duration
 * Field: cr5f7_howlonghasthecandidateresidedattheabov
 */
export const RESIDENCE_DURATION: Record<number, string> = {
  612320000: 'Less than 3 years',
  612320001: '3 years or more'
};

/**
 * Representative Office Functions
 * Field: dfsa_ai_pleaseindicatethefunctionsthecandidate
 */
export const REP_OFFICE_FUNCTIONS: Record<number, string> = {
  356960000: 'Principal Representative',
  356960001: 'Money Laundering Reporting Officer (MLRO)',
  356960002: 'Both Principal Representative and MLRO'
};

/**
 * Licensed Function Choice
 * Field: dfsa_pleaseselectthelicensedfunctiontobecarried
 */
export const LICENSED_FUNCTION_CHOICE: Record<number, string> = {
  1: 'Licensed Director',
  2: 'Licensed Partner',
  3: 'Senior Manager',
  4: 'Responsible Officer'
};

/**
 * Executive Type
 * Field: dfsa_willthecandidatebeanexecutiveornonexecutiv, dfsa_ai_willthecandidatebeanexecutiveornonexecu
 */
export const EXECUTIVE_TYPE: Record<number, string> = {
  356960000: 'Executive',
  356960001: 'Non-executive',
  356960002: 'Proposed Senior Executive Officer/Principal Representative',
  356960003: 'Proposed Director/Partner',
  356960004: 'Director/Partner of head office/or Controller',
  356960005: 'Senior Manager of head office entity',
  356960006: 'Other'
};

/**
 * Generic resolver function
 * Looks up value in provided picklist map
 */
export function resolvePicklist(
  value: number | string | null | undefined,
  picklistMap: Record<number, string>,
  defaultValue: string = ''
): string {
  if (value === null || value === undefined) {
    return defaultValue;
  }

  const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;

  if (isNaN(numericValue)) {
    return defaultValue;
  }

  return picklistMap[numericValue] || defaultValue;
}

/**
 * Convenience resolvers for specific fields
 */
export const resolveGuidelinesConfirm = (value: number | null | undefined) =>
  resolvePicklist(value, GUIDELINES_CONFIRM);

export const resolveTitle = (value: number | null | undefined) =>
  resolvePicklist(value, TITLE_OPTIONS);

export const resolveCitizenshipCount = (value: number | null | undefined) =>
  resolvePicklist(value, CITIZENSHIP_COUNT, 'N/A');

export const resolveCountry = (value: number | null | undefined) =>
  resolvePicklist(value, COUNTRY_OPTIONS, 'Unknown Country');

export const resolveRegulator = (value: number | null | undefined) =>
  resolvePicklist(value, REGULATOR_OPTIONS);

export const resolveResidenceDuration = (value: number | null | undefined) =>
  resolvePicklist(value, RESIDENCE_DURATION);

export const resolveRepOfficeFunction = (value: number | null | undefined) =>
  resolvePicklist(value, REP_OFFICE_FUNCTIONS);

export const resolveLicensedFunctionChoice = (value: number | null | undefined) =>
  resolvePicklist(value, LICENSED_FUNCTION_CHOICE);

export const resolveExecutiveType = (value: number | null | undefined) =>
  resolvePicklist(value, EXECUTIVE_TYPE);

export const resolveRepOfficeFunctions = (value: number | null | undefined) =>
  resolvePicklist(value, REP_OFFICE_FUNCTIONS);

/**
 * Step 2.1: Career History Activity Options
 * Field: dfsa_activity
 */
export const ACTIVITY_OPTIONS: Record<number, string> = {
  356960000: 'Employment',
  356960001: 'Self-Employment',
  356960002: 'Education',
  356960003: 'Vocational Training',
  356960004: 'Unemployed',
  356960005: 'Other'
};

/**
 * Step 2.1: Reason for Leaving Options
 * Field: dfsa_reasonforleaving
 */
export const REASON_FOR_LEAVING_OPTIONS: Record<number, string> = {
  356960000: 'Contract ended',
  356960001: 'Resigned',
  356960002: 'Dismissed',
  356960003: 'Made redundant',
  356960004: 'Retirement',
  356960005: 'Other'
};

/**
 * Step 2.1: Career History Regulator Options
 * Field: dfsa_pleaseselect (in career history context)
 * Note: These are the same regulator options as in Regulatory History
 */
export const CAREER_HISTORY_REGULATOR_OPTIONS: Record<number, string> = REGULATOR_OPTIONS;

/**
 * Convenience resolvers for Career History fields
 */
export const resolveActivity = (value: number | null | undefined) =>
  resolvePicklist(value, ACTIVITY_OPTIONS);

export const resolveReasonForLeaving = (value: number | null | undefined) =>
  resolvePicklist(value, REASON_FOR_LEAVING_OPTIONS);

export const resolveCareerHistoryRegulator = (value: number | null | undefined) =>
  resolvePicklist(value, CAREER_HISTORY_REGULATOR_OPTIONS);

/**
 * Step 2.2: Higher Education Classification Options
 * Field: dfsa_generalclassificationofqualification
 * Note: Only one value confirmed - additional options TBD
 */
export const QUALIFICATION_CLASSIFICATION_OPTIONS: Record<number, string> = {
  356960000: 'Certificate3!',
  // Additional options TBD - will be added when picklist is complete
};

/**
 * Step 2.2: Years of Experience Options
 * Field: dfsa_howmanyyearsexperiencedoesthecandidatehave
 * Note: 5 options - values TBD
 */
export const YEARS_OF_EXPERIENCE_OPTIONS: Record<number, string> = {
  // TBD - awaiting picklist values
  // Placeholder structure for when values are provided
};

/**
 * Convenience resolvers for Step 2.2 fields
 */
export const resolveQualificationClassification = (value: number | null | undefined) =>
  resolvePicklist(value, QUALIFICATION_CLASSIFICATION_OPTIONS, 'Not Specified');

export const resolveYearsOfExperience = (value: number | null | undefined) =>
  resolvePicklist(value, YEARS_OF_EXPERIENCE_OPTIONS, 'Not Specified');
