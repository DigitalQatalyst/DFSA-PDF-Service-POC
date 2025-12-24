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
  DataverseAuthorisedIndividualRecord,
  OtherHoldingEntry
} from '../types/authorisedIndividual';
import {
  resolveGuidelinesConfirm,
  resolveTitle,
  resolveCitizenshipCount,
  resolveCountry,
  resolveRegulator,
  resolveRepOfficeFunctions,
  resolveActivity,
  resolveReasonForLeaving,
  resolveCareerHistoryRegulator,
  resolveQualificationClassification,
  resolveYearsOfExperience
} from './picklistMetadata';

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
      record.dfsa_pleaseselectthelicensedfunctiontobecarried !== undefined,

    // HasCareerHistory Flag: Step 2.1 - Controls Career History section
    // If true → Show career history repeating table
    HasCareerHistory: Boolean(
      record.dfsa_Authorised_Individual_ROAF_Authorised_Individual_CHCCQ30_dfsa_ROAF_Authorised_Individual_ &&
      Array.isArray(record.dfsa_Authorised_Individual_ROAF_Authorised_Individual_CHCCQ30_dfsa_ROAF_Authorised_Individual_) &&
      record.dfsa_Authorised_Individual_ROAF_Authorised_Individual_CHCCQ30_dfsa_ROAF_Authorised_Individual_.length > 0
    ),

    // Step 2.2 Condition Flags
    // HasHigherEducation Flag: Controls Higher Education subgrid
    HasHigherEducation: record.dfsa_doesthecandidatehaveanyhighereducationalawa === true,

    // HasProfessionalQualifications Flag: Controls Professional Qualification subgrid
    HasProfessionalQualifications: record.dfsa_doesthecandidatehaveanyprofessionalqualifica === true,

    // HasOtherQualifications Flag: Controls Other Qualifications subgrid
    HasOtherQualifications: record.dfsa_doesthecandidatehaveanyotherrelevantqualifi === true,

    // HasProfessionalMemberships Flag: Controls Current Professional Memberships subgrid
    HasProfessionalMemberships: record.dfsa_doesthecandidatehaveanycurrentprofession22 === true,

    // HasDIFCExperience Flag: Controls DIFC experience text fields (mutually exclusive)
    HasDIFCExperience: record.dfsa_hasthecandidatepreviouslyworkedinthedifc === true,

    // HasSimilarRoleExperience Flag: Controls similar role experience fields (mutually exclusive)
    HasSimilarRoleExperience: record.dfsa_hasthecandidatepreviouslyworkedinasimilarr === true,

    // Step 2.3 Condition Flags
    // HasOtherHoldings Flag: Controls Other Holdings (Positions) subgrid
    HasOtherHoldings: record.dfsa_doesthecandidatecurrentlyholdorhasthecand === true
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
    Title: resolveTitle(item.dfsa_titlez),
    FullName: item.dfsa_nameasitappearsintheprincipalpassport || '',
    DateOfBirth: formatDate(item.cr5f7_dateofbirth1) || formatDate(item.dfsa_dateofbirth),
    PlaceOfBirth: item.dfsa_placeofbirth || '',
    UaeResident: item.dfsa_uaeresident === true,
    NumberOfCitizenships: resolveCitizenshipCount(item.dfsa_no),
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
    Country: resolveCountry(item.dfsa_countryterritory),
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
      Regulator: resolveRegulator(regulator),
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
 * Map Career History (repeating section - Step 2.1)
 * Entity: dfsa_roaf_authorised_individual_chccq30
 *
 * Handles complex conditional logic:
 * - Activity field controls visibility of "Explain Activity" field
 * - Reason for Leaving field controls visibility of "Explain Reason" field
 * - IsRegulated flag controls visibility of Regulator selection
 * - Regulator selection controls visibility of "Regulator Details" field
 */
function mapCareerHistory(record: DataverseAuthorisedIndividualRecord) {
  const careerHistory =
    record.dfsa_Authorised_Individual_ROAF_Authorised_Individual_CHCCQ30_dfsa_ROAF_Authorised_Individual_;

  if (!careerHistory || !Array.isArray(careerHistory)) {
    logger.debug('[Mapper] No career history records found');
    return [];
  }

  logger.info('[Mapper] Mapping career history', { count: careerHistory.length });

  return careerHistory.map((item: any) => {
    const activity = item.dfsa_activity;
    const reasonForLeaving = item.dfsa_reasonforleaving;
    const regulator = item.dfsa_pleaseselect;

    // Conditional field visibility logic
    const isActivityOther = activity === 356960005; // "Other"
    const isReasonOther = reasonForLeaving === 356960005; // "Other"
    const isRegulated = item.dfsa_iswasregulated === true;
    const isRegulatorOther = regulator === 356960087; // "Other" regulator

    return {
      // Required Fields
      Activity: String(activity || ''),
      ActivityLabel: resolveActivity(activity),
      NameOfEstablishment: item.dfsa_nameofestablishment || '',
      DateFrom: formatDate(item.dfsa_datefrom),
      DateTo: formatDate(item.dfsa_dateto), // null if current position
      PositionTitle: item.dfsa_positiontitle || '',
      ReasonForLeaving: String(reasonForLeaving || ''),
      ReasonForLeavingLabel: resolveReasonForLeaving(reasonForLeaving),

      // Conditional: Explain Activity (shown if Activity = Other)
      ExplainActivity: isActivityOther ? (item.dfsa_pleaseexplainactivity || null) : null,

      // Conditional: Explain Reason for Leaving (shown if Reason = Other)
      ExplainReasonForLeaving: isReasonOther ? (item.dfsa_pleaseexplainreasonforleaving || null) : null,

      // Activities Undertaken (conditional field)
      ActivitiesUndertaken: item.dfsa_activitiesundertakenbyemployer || null,

      // Address Fields (conditional - shown based on Activity selection)
      Address: item.dfsa_buildingnamenumber || null,
      StreetName: item.dfsa_streetname || null,
      District: item.dfsa_district || null,
      City: item.dfsa_city || null,
      PostcodePoBox: item.dfsa_postcodepobox || null,
      TelephoneNumber: item.dfsa_telephonenumber || null,

      // Contact Person Fields (conditional - shown based on Activity selection)
      ContactPerson: item.dfsa_contactpersonwithinemployer || null,
      ContactPosition: item.dfsa_positiontitleofcontactperson || null,
      ContactTelephone: item.dfsa_contacttelephonenumber || null,
      ContactEmail: item.dfsa_contactemailaddress || null,

      // Regulatory Information (conditional - shown if IsRegulated = true)
      IsRegulated: isRegulated,
      Regulator: isRegulated ? String(regulator || '') : null,
      RegulatorLabel: isRegulated ? resolveCareerHistoryRegulator(regulator) : null,

      // Conditional: Regulator Details (shown if Regulator = Other)
      RegulatorDetails: isRegulated && isRegulatorOther
        ? (item.dfsa_pleaseprovidedetailsoftheregulator || null)
        : null,

      // Activity Details
      ActivityDetails: item.dfsa_pleaseprovidedetailsofyouractivitieswithn || null
    };
  });
}

/**
 * Map Candidate Profile (Step 2.1 - File Uploads)
 * Handles CV and Job Description file references
 */
function mapCandidateProfile(record: DataverseAuthorisedIndividualRecord) {
  // TODO: In production, fetch actual file metadata and URLs from Dataverse
  // For POC, just capture file IDs
  return {
    CVFileId: record.dfsa_pleaseuploadthecandidatescurriculumvitae || null,
    CVFileName: record.dfsa_pleaseuploadthecandidatescurriculumvitae
      ? `CV_${record.dfsa_authorised_individualid}.pdf`
      : null,
    CVFileUrl: record.dfsa_pleaseuploadthecandidatescurriculumvitae
      ? `/api/files/${record.dfsa_pleaseuploadthecandidatescurriculumvitae}`
      : null,
    JobDescriptionFileId: record.dfsa_pleaseuploadthecandidatesjobdescription || null,
    JobDescriptionFileName: record.dfsa_pleaseuploadthecandidatesjobdescription
      ? `JobDescription_${record.dfsa_authorised_individualid}.pdf`
      : null,
    JobDescriptionFileUrl: record.dfsa_pleaseuploadthecandidatesjobdescription
      ? `/api/files/${record.dfsa_pleaseuploadthecandidatesjobdescription}`
      : null
  };
}

/**
 * Map Higher Education (repeating section - Step 2.2)
 * Entity: dfsa_authorised_individual_aiciq
 * Relationship: dfsa_Authorised_Individual_Authorised_Individual_AICIQ93_dfsa_Authorised_Individual_AICIQ
 */
function mapHigherEducation(record: DataverseAuthorisedIndividualRecord) {
  const higherEducation =
    record.dfsa_Authorised_Individual_Authorised_Individual_AICIQ93_dfsa_Authorised_Individual_AICIQ;

  if (!higherEducation || !Array.isArray(higherEducation)) {
    logger.debug('[Mapper] No higher education records found');
    return [];
  }

  logger.info('[Mapper] Mapping higher education', { count: higherEducation.length });

  return higherEducation.map((item: any) => ({
    TitleOfQualification: item.dfsa_titleofqualification || '',
    UniversityName: item.dfsa_fullnameofuniversity || '',
    DateOfAward: formatDate(item.dfsa_dateofaward),
    Classification: String(item.dfsa_generalclassificationofqualification || ''),
    ClassificationLabel: resolveQualificationClassification(item.dfsa_generalclassificationofqualification)
  }));
}

/**
 * Map Professional Qualifications (repeating section - Step 2.2)
 * Entity: dfsa_authorised_individual_aiciq96
 * Relationship: dfsa_Authorised_Individual_dfsa_Authorised_Individual_dfsa_Authorised_Individual_AICIQ96
 */
function mapProfessionalQualifications(record: DataverseAuthorisedIndividualRecord) {
  const professionalQuals =
    record.dfsa_Authorised_Individual_dfsa_Authorised_Individual_dfsa_Authorised_Individual_AICIQ96;

  if (!professionalQuals || !Array.isArray(professionalQuals)) {
    logger.debug('[Mapper] No professional qualification records found');
    return [];
  }

  logger.info('[Mapper] Mapping professional qualifications', { count: professionalQuals.length });

  return professionalQuals.map((item: any) => ({
    QualificationName: item.dfsa_fullnameofqualification || '',
    InstituteName: item.dfsa_fullnameofinstitute || '',
    DateOfAward: formatDate(item.dfsa_dateofaward)
  }));
}

/**
 * Map Other Qualifications (repeating section - Step 2.2)
 * Entity: dfsa_authorised_individual_aiciq99
 * Relationship: dfsa_Authorised_Individual_dfsa_Authorised_Individual_dfsa_Authorised_Individual_AICIQ99
 */
function mapOtherQualifications(record: DataverseAuthorisedIndividualRecord) {
  const otherQuals =
    record.dfsa_Authorised_Individual_dfsa_Authorised_Individual_dfsa_Authorised_Individual_AICIQ99;

  if (!otherQuals || !Array.isArray(otherQuals)) {
    logger.debug('[Mapper] No other qualification records found');
    return [];
  }

  logger.info('[Mapper] Mapping other qualifications', { count: otherQuals.length });

  return otherQuals.map((item: any) => ({
    QualificationName: item.dfsa_fullnameofqualification || '',
    InstituteName: item.dfsa_fullnameofinstitute || '',
    DateOfAward: formatDate(item.dfsa_dateofaward)
  }));
}

/**
 * Map Professional Memberships (repeating section - Step 2.2)
 * Entity: dfsa_authorised_individual_aiciq102
 * Relationship: dfsa_Authorised_Individual_dfsa_Authorised_Individual_dfsa_Authorised_Individual_AICIQ102
 */
function mapProfessionalMemberships(record: DataverseAuthorisedIndividualRecord) {
  const memberships =
    record.dfsa_Authorised_Individual_dfsa_Authorised_Individual_dfsa_Authorised_Individual_AICIQ102;

  if (!memberships || !Array.isArray(memberships)) {
    logger.debug('[Mapper] No professional membership records found');
    return [];
  }

  logger.info('[Mapper] Mapping professional memberships', { count: memberships.length });

  return memberships.map((item: any) => ({
    OrganisationName: item.dfsa_fullnameoforganisation || '',
    DateOfAdmission: formatDate(item.dfsa_dateofadmissionmembership),
    OrganisationExplanation: item.dfsa_briefexplanationoforganisation || ''
  }));
}

/**
 * Map Work Experience Information (Step 2.2)
 * Handles conditional text fields based on Yes/No flags
 */
function mapWorkExperience(record: DataverseAuthorisedIndividualRecord, flags: ConditionFlags) {
  return {
    // DIFC Experience
    HasDIFCExperience: flags.HasDIFCExperience,
    DIFCExperienceOverview: flags.HasDIFCExperience
      ? (record.dfsa_pleaseprovideanoverviewofdifcexperience || null)
      : null,
    DIFCKnowledgePlan: !flags.HasDIFCExperience
      ? (record.dfsa_pleaseexplainhowthecandidatewillobtainrelev || null)
      : null,

    // Similar Role Experience
    HasSimilarRoleExperience: flags.HasSimilarRoleExperience,
    YearsOfExperience: flags.HasSimilarRoleExperience
      ? String(record.dfsa_howmanyyearsexperiencedoesthecandidatehave || '')
      : null,
    YearsOfExperienceLabel: flags.HasSimilarRoleExperience
      ? resolveYearsOfExperience(record.dfsa_howmanyyearsexperiencedoesthecandidatehave)
      : null,
    ExperiencePlan: !flags.HasSimilarRoleExperience
      ? (record.dfsa_howwillthecandidateobtaintherelevantexperie || null)
      : null
  };
}

/**
 * Maps Step 2.3 - Other Holdings (Positions of Controller, Director or Partner)
 * Entity: dfsa_roaf_authorised_individual_opohq117
 * Relationship: dfsa_Authorised_Individual_ROAF_Authorised_Individual_OPOHQ117_dfsa_ROAF_Authorised_Individual
 */
function mapOtherHoldings(record: DataverseAuthorisedIndividualRecord): OtherHoldingEntry[] {
  const otherHoldings =
    record.dfsa_Authorised_Individual_ROAF_Authorised_Individual_OPOHQ117_dfsa_ROAF_Authorised_Individual;

  if (!otherHoldings || !Array.isArray(otherHoldings)) {
    return [];
  }

  return otherHoldings.map((item: any) => {
    const isRegulated = item.dfsa_regulated === true;
    const hasConflictOfInterest = item.dfsa_anypotentialconflictofinterest === true;
    const regulator = item.dfsa_regulator;

    return {
      // Required Fields
      NameOfEntity: item.dfsa_nameofentity || '',
      DetailsOfPosition: item.dfsa_detailsofposition || '',
      DateFrom: formatDate(item.dfsa_from),
      DateTo: formatDate(item.dfsa_toleaveblankifcurrent),

      // Optional Fields
      Address: item.dfsa_address || null,
      NatureOfBusiness: item.dfsa_natureofbusiness || null,
      OwnershipText: item.dfsa_ownershipifapplicable || null,
      OwnershipPercentage: item.dfsa_auth_ind_ownershipifapplicable !== null && item.dfsa_auth_ind_ownershipifapplicable !== undefined
        ? Number(item.dfsa_auth_ind_ownershipifapplicable)
        : null,

      // Conditional: Regulated - show/require Regulator field
      IsRegulated: isRegulated,
      Regulator: isRegulated ? String(regulator || '') : null,
      RegulatorLabel: isRegulated ? resolveRegulator(regulator) : null,

      // Conditional: Conflict of Interest - show/require clarification field
      HasConflictOfInterest: hasConflictOfInterest,
      PotentialConflictClarification: hasConflictOfInterest
        ? (item.dfsa_potentialconflictclarification || null)
        : null
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
      ConfirmRead: resolveGuidelinesConfirm(record.dfsa_iconfirmthatihavecarefullyreadandup)
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
      // CONDITIONAL: Rep Office Functions (only if Rep Office = Yes)
      RepOfficeFunctions: flags.RepOffice
        ? resolveRepOfficeFunctions(record.dfsa_ai_pleaseindicatethefunctionsthecandidate)
        : null,
      Contact: {
        Address: record.dfsa_address || '',
        PostCode: record.dfsa_postcodepobox || '',
        Country: resolveCountry(record.dfsa_countryauthindividual),
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
            Country: resolveCountry(record.dfsa_country2)
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

    // Step 2.1: Career History and Candidate Profile
    CareerHistory: mapCareerHistory(record),
    CandidateProfile: mapCandidateProfile(record),

    // Step 2.2: Qualifications & Experience
    HigherEducation: flags.HasHigherEducation ? mapHigherEducation(record) : [],
    ProfessionalQualifications: flags.HasProfessionalQualifications ? mapProfessionalQualifications(record) : [],
    OtherQualifications: flags.HasOtherQualifications ? mapOtherQualifications(record) : [],
    ProfessionalMemberships: flags.HasProfessionalMemberships ? mapProfessionalMemberships(record) : [],
    WorkExperience: mapWorkExperience(record, flags),

    // Step 2.3: Other Holdings
    OtherHoldings: flags.HasOtherHoldings ? mapOtherHoldings(record) : [],

    // Metadata
    GeneratedAt: new Date().toISOString(),
    TemplateVersion: '1.0'
  };

  logger.info('[Mapper] DTO mapping completed', {
    hasPassportDetails: dto.PassportDetails.length > 0,
    hasCitizenships: dto.Citizenships.length > 0,
    hasRegulatoryHistory: dto.RegulatoryHistory.length > 0,
    hasCareerHistory: dto.CareerHistory.length > 0,
    hasCVFile: dto.CandidateProfile.CVFileId !== null,
    hasJobDescriptionFile: dto.CandidateProfile.JobDescriptionFileId !== null,
    hasHigherEducation: dto.HigherEducation.length > 0,
    hasProfessionalQualifications: dto.ProfessionalQualifications.length > 0,
    hasOtherQualifications: dto.OtherQualifications.length > 0,
    hasProfessionalMemberships: dto.ProfessionalMemberships.length > 0,
    hasDIFCExperience: dto.WorkExperience.HasDIFCExperience,
    hasSimilarRoleExperience: dto.WorkExperience.HasSimilarRoleExperience,
    hasOtherHoldings: dto.OtherHoldings.length > 0,
    showLicensedFunctions: dto.LicensedFunctions.ShowLicensedFunctionsSection,
    hasPreviousAddress: dto.Application.PreviousAddress !== null,
    hasOtherNames: dto.Application.OtherNames !== null
  });

  return dto;
}

export default {
  mapToDTO
};
