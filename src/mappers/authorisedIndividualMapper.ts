/**
 * Authorised Individual Mapper
 * Maps Dataverse entity data to canonical DTO structure
 *
 * KEY POC DEMONSTRATION:
 * - Shows conditional flag evaluation
 * - Maps 71 fields from canonical structure
 * - Handles repeating sections (passport, citizenship, regulatory history)
 * - Demonstrates section visibility logic
 */

import logger from '../utils/logger';
import {
  AuthorisedIndividualDTO,
  ConditionFlags,
  DataverseAuthorisedIndividualRecord
} from '../types/authorisedIndividual';

/**
 * Build condition flags from Dataverse data
 * These flags control which sections appear in the PDF
 *
 * Based on Condition Flags Registry from canonical structure
 */
function buildConditionFlags(record: DataverseAuthorisedIndividualRecord): ConditionFlags {
  logger.debug('[Mapper] Building condition flags', {
    repOffice: record.dfsa_ai_isthecandidateapplyingonbehalfofarepres,
    previouslyHeld: record.dfsa_hasthecandidatepreviouslyheldauthorisedindiv,
    otherNames: record.dfsa_hasthecandidateeverusedothernamesorchanged,
    residenceDuration: record.cr5f7_howlonghasthecandidateresidedattheabov,
    hasStartDate: record.new_ai_doyouhaveproposedstartingdate,
    hasRegulatoryHistory: record.dfsa_doesthecandidateholdorhaspreviouslyheldin
  });

  const flags: ConditionFlags = {
    // RepOffice Flag: Controls Licensed Functions section visibility
    // If true → Hide Licensed Functions section, show Rep Office functions
    RepOffice: record.dfsa_ai_isthecandidateapplyingonbehalfofarepres === true,

    // PreviouslyHeld Flag: Controls candidate lookup field
    PreviouslyHeld: record.dfsa_hasthecandidatepreviouslyheldauthorisedindiv === true,

    // OtherNames Flag: Controls other names subsection
    // If true → Show 4 additional fields (state other names, native name, date, reason)
    OtherNames: record.dfsa_hasthecandidateeverusedothernamesorchanged === true,

    // ResidenceDurationLessThan3Years Flag: Controls Previous Address section
    // 612320000 = "Less than 3 years" option set value
    // If true → Show Previous Address section
    ResidenceDurationLessThan3Years: record.cr5f7_howlonghasthecandidateresidedattheabov === 612320000,

    // HasStartDate Flag: Controls start date vs explanation field
    HasStartDate: record.new_ai_doyouhaveproposedstartingdate === true,

    // HasRegulatoryHistory Flag: Controls entire Regulatory History section
    // If true → Show repeating table of regulatory licenses
    HasRegulatoryHistory: record.dfsa_doesthecandidateholdorhaspreviouslyheldin === true,

    // LicensedFunctionSelected Flag: Indicates if user selected a function
    LicensedFunctionSelected:
      record.dfsa_pleaseselectthelicensedfunctiontobecarried !== null &&
      record.dfsa_pleaseselectthelicensedfunctiontobecarried !== undefined
  };

  logger.info('[Mapper] Condition flags built', { flags });

  return flags;
}

/**
 * Format choice/option set value to label
 * TODO: In production, fetch from Dataverse metadata for accurate labels
 */
function formatChoiceLabel(value: number | string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  // For POC, return as-is. Production should lookup option set labels
  return String(value);
}

/**
 * Format date field
 */
function formatDate(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    // Extract date part only (remove time)
    return value.split('T')[0];
  }
  return String(value);
}

/**
 * Format Licensed Function choice to enum value
 */
function formatLicensedFunctionChoice(value: number | null | undefined): string {
  const map: Record<number, string> = {
    1: 'LicensedDirector',
    2: 'LicensedPartner',
    3: 'SeniorManager',
    4: 'ResponsibleOfficer'
  };
  return value !== null && value !== undefined ? (map[value] || '') : '';
}

/**
 * Format Licensed Function choice to display label
 */
function formatLicensedFunctionChoiceLabel(value: number | null | undefined): string {
  const map: Record<number, string> = {
    1: 'Licensed Director',
    2: 'Licensed Partner',
    3: 'Senior Manager',
    4: 'Responsible Officer'
  };
  return value !== null && value !== undefined ? (map[value] || '') : '';
}

/**
 * Build Licensed Functions section data with conditional logic
 * This demonstrates complex conditional rendering
 */
function buildLicensedFunctions(record: DataverseAuthorisedIndividualRecord, flags: ConditionFlags) {
  const licensedFunctionChoice = record.dfsa_pleaseselectthelicensedfunctiontobecarried;
  const isResponsibleOfficer = licensedFunctionChoice === 4;

  return {
    // Section visibility: Hidden if applying for Rep Office
    ShowLicensedFunctionsSection: !flags.RepOffice,

    // Mandatory functions question: Hidden if Responsible Officer selected
    ShowMandatoryFunctionsQuestion:
      !flags.RepOffice &&
      licensedFunctionChoice !== null &&
      licensedFunctionChoice !== undefined &&
      licensedFunctionChoice !== 4,

    LicensedFunctionChoice: formatLicensedFunctionChoice(licensedFunctionChoice),
    LicensedFunctionChoiceLabel: formatLicensedFunctionChoiceLabel(licensedFunctionChoice),

    // Mandatory functions checkboxes
    SeniorExecutiveOfficer: record.dfsa_ml_seniorexecutiveofficer === true,
    FinanceOfficer: record.dfsa_ml_financeofficer === true,
    ComplianceOfficer: record.dfsa_ml_complianceofficer1 === true,
    MLRO: record.dfsa_ml_moneylaunderingreportingofficer === true,
    NoMandatoryFunction: record.dfsa_ml_nomandatoryfunction === true,

    // Responsible Officer confirmations: Only shown if Responsible Officer selected
    ShowResponsibleOfficerConfirmations: !flags.RepOffice && isResponsibleOfficer,
    RespResp1: record.cr5f7_theapplicanthassignificantresponsibilityfort || '',
    RespResp2: record.cr5f7_theapplicantexercisesasignificantinfluenceon || '',
    RespResp3: record.cr5f7_theapplicantisnotanemployeeoftheauthorised || '',

    ExecutiveType: formatChoiceLabel(record.dfsa_ai_willthecandidatebeanexecutiveornonexecu)
  };
}

/**
 * Map Passport Details (repeating section)
 */
function mapPassportDetails(record: DataverseAuthorisedIndividualRecord) {
  const passportDetails = record.cr5f7_AI_Q12_CandidateInfo;

  if (!passportDetails || !Array.isArray(passportDetails)) {
    logger.debug('[Mapper] No passport details found');
    return [];
  }

  logger.info('[Mapper] Mapping passport details', { count: passportDetails.length });

  return passportDetails.map((item: any) => ({
    Title: formatChoiceLabel(item.dfsa_titlez),
    FullName: item.dfsa_nameasitappearsintheprincipalpassport || '',
    DateOfBirth: formatDate(item.cr5f7_dateofbirth1) || formatDate(item.dfsa_dateofbirth),
    PlaceOfBirth: item.dfsa_placeofbirth || '',
    UaeResident: item.dfsa_uaeresident === true,
    NumberOfCitizenships: formatChoiceLabel(item.dfsa_no) || 'N/A',
    OtherNames: item.dfsa_othernames || '',
    NativeName: item.dfsa_nameinnativelanguageifapplicable || ''
  }));
}

/**
 * Map Citizenships (repeating section)
 */
function mapCitizenships(record: DataverseAuthorisedIndividualRecord) {
  const citizenships =
    record.cr5f7_dfsa_Authorised_Individual_AI_Q13_CitizenshipInfo_dfsa_ROAF_authorised_Individual_AICIQ13;

  if (!citizenships || !Array.isArray(citizenships)) {
    logger.debug('[Mapper] No citizenship records found');
    return [];
  }

  logger.info('[Mapper] Mapping citizenships', { count: citizenships.length });

  return citizenships.map((item: any) => ({
    Country: formatChoiceLabel(item.dfsa_countryterritory),
    PassportNo: item.dfsa_passportno || '',
    ExpiryDate: formatDate(item.cr5f7_expirydate1) || formatDate(item.dfsa_expirydate)
  }));
}

/**
 * Map Regulatory History (repeating section - conditional)
 */
function mapRegulatoryHistory(record: DataverseAuthorisedIndividualRecord) {
  const history =
    record.cr5f7_dfsa_Authorised_Individual_AI_Q28_LicenceDetails_dfsa_ROAF_authorised_Individual_AICIQ28;

  if (!history || !Array.isArray(history)) {
    logger.debug('[Mapper] No regulatory history found');
    return [];
  }

  logger.info('[Mapper] Mapping regulatory history', { count: history.length });

  return history.map((item: any) => {
    const regulator = item.dfsa_regulator;
    const isOther = regulator === 356960087; // "Other" option set value

    return {
      Regulator: formatChoiceLabel(regulator),
      DateStarted: formatDate(item.dfsa_datestarted),
      DateFinished: formatDate(item.dfsa_datefinishedifapplicable),
      LicenseName: item.dfsa_nameoflicenseregistration || '',
      RegisterName: item.dfsa_nameoflicenseregister || '',
      Overview: item.dfsa_briefoverviewoflicenseregistration || '',
      IsOtherRegulator: isOther,
      OtherRegulatorDetails: isOther ? (item.dfsa_regulatorrownumberinq28pleaseprovidedet || '') : null
    };
  });
}

/**
 * Main mapping function
 * Transforms Dataverse record to canonical DTO structure
 */
export function mapToDTO(
  record: DataverseAuthorisedIndividualRecord,
  documentType: string = 'AuthorisedIndividual'
): AuthorisedIndividualDTO {
  logger.info('[Mapper] Starting DTO mapping', {
    documentType,
    recordId: record.dfsa_authorised_individualid
  });

  // Build condition flags FIRST
  const flags = buildConditionFlags(record);

  // Build DTO matching canonical structure
  const dto: AuthorisedIndividualDTO = {
    // Step 0.1: Guidelines
    Guidelines: {
      ConfirmRead: formatChoiceLabel(record.dfsa_iconfirmthatihavecarefullyreadandup)
    },

    // Step 0.2: DIFC Disclosure
    DIFCDisclosure: {
      ConsentToDisclosure: record.cr5f7_doyouconsenttothedisclosureoftheinformatio === true
    },

    // Step 0.3 + 1.1: Application Information
    Application: {
      Id: record.dfsa_authorised_individualid,
      FirmName: record.dfsa_firmnamesd || '',
      FirmNumber: record.cr5f7_firmnumber || '',
      Requestor: {
        Name: record.cr5f7_nameofpersonmakingthesubmission || '',
        Position: record.dfsa_positiontitleofcontactperson || '',
        Email: record.dfsa_ai_emailaddress || '',
        Phone: record.dfsa_contacttelephonenumber || ''
      },
      AuthorisedIndividualName: record.dfsa_proposedauthorisedindividualname || '',
      Contact: {
        Address: record.dfsa_address || '',
        PostCode: record.dfsa_postcodepobox || '',
        Country: formatChoiceLabel(record.dfsa_countryauthindividual),
        Mobile: record.dfsa_mobiletelephonenumber || '',
        Email: record.dfsa_contactemailaddress || '',
        ResidenceDuration: record.cr5f7_howlonghasthecandidateresidedattheabov === 612320000
          ? 'Less than 3 years'
          : '3 years or more'
      },
      // CONDITIONAL: Previous Address (only if residence < 3 years)
      PreviousAddress: flags.ResidenceDurationLessThan3Years
        ? {
            Address: record.dfsa_buildingnamenumber || '',
            PostCode: record.dfsa_postcode_pobox || '',
            Country: formatChoiceLabel(record.dfsa_country2)
          }
        : null,
      // CONDITIONAL: Other Names (only if has used other names)
      OtherNames: flags.OtherNames
        ? {
            StateOtherNames: record.dfsa_stateothernames || '',
            NativeName: record.dfsa_nameinnativelanguageifapplicable || '',
            DateChanged: formatDate(record.cr5f7_datenamechanged1),
            Reason: record.dfsa_reasonforchangeofname || ''
          }
        : null
    },

    // Condition Flags
    Flags: flags,

    // Step 1.1: Licensed Functions (with complex conditional logic)
    LicensedFunctions: buildLicensedFunctions(record, flags),

    // Step 1.1: Repeating Sections
    PassportDetails: mapPassportDetails(record),
    Citizenships: mapCitizenships(record),
    // CONDITIONAL: Regulatory History (only if has regulatory history)
    RegulatoryHistory: flags.HasRegulatoryHistory ? mapRegulatoryHistory(record) : [],

    // Step 1.1: Position Information
    Position: {
      ProposedJobTitle: record.dfsa_whatisthecandidatesproposedjobtitle || '',
      HasProposedStartDate: flags.HasStartDate,
      ProposedStartDate: flags.HasStartDate
        ? formatDate(record.cr5f7_whatisthecandidatesproposedstartingdate)
        : null,
      StartDateExplanation: !flags.HasStartDate ? (record.new_ai_pleaseexplain || '') : null,
      WillBeMLRO: record.new_ai_willthecandidateapplyingforprincipalrepre === true
    },

    // Metadata
    GeneratedAt: new Date().toISOString(),
    TemplateVersion: '1.0'
  };

  logger.info('[Mapper] DTO mapping completed', {
    hasPassportDetails: dto.PassportDetails.length > 0,
    hasCitizenships: dto.Citizenships.length > 0,
    hasRegulatoryHistory: dto.RegulatoryHistory.length > 0,
    showLicensedFunctions: dto.LicensedFunctions.ShowLicensedFunctionsSection,
    hasPreviousAddress: dto.Application.PreviousAddress !== null,
    hasOtherNames: dto.Application.OtherNames !== null
  });

  return dto;
}

export default {
  mapToDTO
};
