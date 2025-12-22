/**
 * TypeScript interfaces for Authorised Individual
 * Based on canonical structure provided by colleague
 */

/**
 * Condition Flags - Control section/field visibility
 * Based on Condition Flags Registry from canonical structure
 */
export interface ConditionFlags {
  RepOffice: boolean;                        // Is candidate applying for Representative Office?
  PreviouslyHeld: boolean;                   // Has candidate previously held AI status?
  OtherNames: boolean;                       // Has candidate used other names?
  ResidenceDurationLessThan3Years: boolean;  // Has lived at address < 3 years?
  HasStartDate: boolean;                     // Has proposed starting date?
  HasRegulatoryHistory: boolean;             // Holds/held license with regulator?
  LicensedFunctionSelected: boolean;         // Has selected a licensed function?
  HasCareerHistory: boolean;                 // NEW: Step 2.1 - Has career history entries?
}

/**
 * Career History Entry (repeating section - Step 2.1)
 * Entity: dfsa_roaf_authorised_individual_chccq30
 */
export interface CareerHistoryEntry {
  // Required Fields
  Activity: string;                     // dfsa_activity (Choice)
  ActivityLabel: string;                // Display label for activity
  NameOfEstablishment: string;          // dfsa_nameofestablishment
  DateFrom: string;                     // dfsa_datefrom (DD-MM-YYYY)
  DateTo: string | null;                // dfsa_dateto (blank if current)
  PositionTitle: string;                // dfsa_positiontitle
  ReasonForLeaving: string;             // dfsa_reasonforleaving (Choice)
  ReasonForLeavingLabel: string;        // Display label for reason

  // Conditional Fields (shown based on Activity)
  ExplainActivity: string | null;       // dfsa_pleaseexplainactivity (if Activity = Other)
  ExplainReasonForLeaving: string | null; // dfsa_pleaseexplainreasonforleaving (if Reason = Other)
  ActivitiesUndertaken: string | null;  // dfsa_activitiesundertakenbyemployer

  // Address Fields (conditional)
  Address: string | null;               // dfsa_buildingnamenumber
  StreetName: string | null;            // dfsa_streetname
  District: string | null;              // dfsa_district
  City: string | null;                  // dfsa_city
  PostcodePoBox: string | null;         // dfsa_postcodepobox
  TelephoneNumber: string | null;       // dfsa_telephonenumber

  // Contact Person Fields (conditional)
  ContactPerson: string | null;         // dfsa_contactpersonwithinemployer
  ContactPosition: string | null;       // dfsa_positiontitleofcontactperson
  ContactTelephone: string | null;      // dfsa_contacttelephonenumber
  ContactEmail: string | null;          // dfsa_contactemailaddress

  // Regulatory Information (conditional)
  IsRegulated: boolean;                 // dfsa_iswasregulated
  Regulator: string | null;             // dfsa_pleaseselect (Choice)
  RegulatorLabel: string | null;        // Display label for regulator
  RegulatorDetails: string | null;      // dfsa_pleaseprovidedetailsoftheregulator (if Regulator = Other)

  // Activity Details
  ActivityDetails: string | null;       // dfsa_pleaseprovidedetailsofyouractivitieswithn
}

/**
 * Candidate Profile (Step 2.1)
 */
export interface CandidateProfile {
  CVFileId: string | null;              // dfsa_pleaseuploadthecandidatescurriculumvitae (File)
  CVFileName: string | null;
  CVFileUrl: string | null;
  JobDescriptionFileId: string | null;  // dfsa_pleaseuploadthecandidatesjobdescription (File)
  JobDescriptionFileName: string | null;
  JobDescriptionFileUrl: string | null;
}

/**
 * Requestor Information (Step 0.3)
 */
export interface RequestorInfo {
  Name: string;
  Position: string;
  Email: string;
  Phone: string;
}

/**
 * Contact Information
 */
export interface ContactInfo {
  Address: string;
  PostCode: string;
  Country: string;
  Mobile: string;
  Email: string;
  ResidenceDuration: string; // "Less than 3 years" or "3 years or more"
}

/**
 * Previous Address (conditional - shown if residence < 3 years)
 */
export interface PreviousAddressInfo {
  Address: string;
  PostCode: string;
  Country: string;
}

/**
 * Other Names Information (conditional)
 */
export interface OtherNamesInfo {
  StateOtherNames: string;
  NativeName: string;
  DateChanged: string;
  Reason: string;
}

/**
 * Licensed Functions Section (conditional - hidden if RepOffice = true)
 */
export interface LicensedFunctionsInfo {
  ShowLicensedFunctionsSection: boolean;
  ShowMandatoryFunctionsQuestion: boolean;
  LicensedFunctionChoice: string; // "LicensedDirector" | "LicensedPartner" | "SeniorManager" | "ResponsibleOfficer"
  LicensedFunctionChoiceLabel: string;
  SeniorExecutiveOfficer: boolean;
  FinanceOfficer: boolean;
  ComplianceOfficer: boolean;
  MLRO: boolean;
  NoMandatoryFunction: boolean;
  ShowResponsibleOfficerConfirmations: boolean;
  RespResp1?: string;
  RespResp2?: string;
  RespResp3?: string;
  ExecutiveType?: string;
}

/**
 * Passport Details (repeating section)
 */
export interface PassportDetail {
  Title: string;
  FullName: string;
  DateOfBirth: string;
  PlaceOfBirth: string;
  UaeResident: boolean;
  NumberOfCitizenships: string;
  OtherNames: string;
  NativeName: string;
}

/**
 * Citizenship (repeating section)
 */
export interface CitizenshipInfo {
  Country: string;
  PassportNo: string;
  ExpiryDate: string;
}

/**
 * Regulatory History (repeating section - conditional)
 */
export interface RegulatoryHistoryEntry {
  Regulator: string;
  DateStarted: string;
  DateFinished: string | null;
  LicenseName: string;
  RegisterName: string;
  Overview: string;
  IsOtherRegulator: boolean;
  OtherRegulatorDetails: string | null;
}

/**
 * Position Information
 */
export interface PositionInfo {
  ProposedJobTitle: string;
  HasProposedStartDate: boolean;
  ProposedStartDate: string | null;
  StartDateExplanation: string | null;
  WillBeMLRO: boolean;
}

/**
 * Application Information
 */
export interface ApplicationInfo {
  Id: string;
  FirmName: string;
  FirmNumber: string;
  Requestor: RequestorInfo;
  AuthorisedIndividualName: string;
  RepOfficeFunctions: string | null; // Conditional: only when RepOffice = Yes
  Contact: ContactInfo;
  PreviousAddress: PreviousAddressInfo | null;
  OtherNames: OtherNamesInfo | null;
}

/**
 * Complete DTO matching canonical structure
 * This is what gets passed to the PDF template
 */
export interface AuthorisedIndividualDTO {
  // Step 0.1
  Guidelines: {
    ConfirmRead: string;
  };

  // Step 0.2
  DIFCDisclosure: {
    ConsentToDisclosure: boolean;
  };

  // Step 0.3 + 1.1
  Application: ApplicationInfo;

  // Condition Flags
  Flags: ConditionFlags;

  // Step 1.1 - Licensed Functions (conditional)
  LicensedFunctions: LicensedFunctionsInfo;

  // Step 1.1 - Repeating Sections
  PassportDetails: PassportDetail[];
  Citizenships: CitizenshipInfo[];
  RegulatoryHistory: RegulatoryHistoryEntry[];

  // Step 1.1 - Position
  Position: PositionInfo;

  // Step 2.1 - Career History
  CareerHistory: CareerHistoryEntry[];
  CandidateProfile: CandidateProfile;

  // Metadata
  GeneratedAt: string;
  TemplateVersion: string;
}

/**
 * Raw Dataverse record structure (for reference)
 */
export interface DataverseAuthorisedIndividualRecord {
  dfsa_authorised_individualid: string;
  // Step 0.1
  dfsa_iconfirmthatihavecarefullyreadandup?: number;
  // Step 0.2
  cr5f7_doyouconsenttothedisclosureoftheinformatio?: boolean;
  // Step 0.3
  dfsa_firmnamesd?: string;
  cr5f7_firmnumber?: string;
  cr5f7_nameofpersonmakingthesubmission?: string;
  dfsa_positiontitleofcontactperson?: string;
  dfsa_ai_emailaddress?: string;
  dfsa_contacttelephonenumber?: string;
  dfsa_proposedauthorisedindividualname?: string;
  // Step 1.1 - flags
  dfsa_ai_isthecandidateapplyingonbehalfofarepres?: boolean;
  dfsa_hasthecandidatepreviouslyheldauthorisedindiv?: boolean;
  dfsa_hasthecandidateeverusedothernamesorchanged?: boolean;
  cr5f7_howlonghasthecandidateresidedattheabov?: number;
  new_ai_doyouhaveproposedstartingdate?: boolean;
  dfsa_doesthecandidateholdorhaspreviouslyheldin?: boolean;
  // Related entities
  cr5f7_AI_Q12_CandidateInfo?: any[];
  cr5f7_dfsa_Authorised_Individual_AI_Q13_CitizenshipInfo_dfsa_ROAF_authorised_Individual_AICIQ13?: any[];
  cr5f7_dfsa_Authorised_Individual_AI_Q28_LicenceDetails_dfsa_ROAF_authorised_Individual_AICIQ28?: any[];
  // Step 2.1 - Career History subgrid
  dfsa_Authorised_Individual_ROAF_Authorised_Individual_CHCCQ30_dfsa_ROAF_Authorised_Individual_?: any[];
  // Step 2.1 - File uploads
  dfsa_pleaseuploadthecandidatescurriculumvitae?: string; // File ID
  dfsa_pleaseuploadthecandidatesjobdescription?: string;  // File ID
  // ... many more fields
  [key: string]: any;
}
