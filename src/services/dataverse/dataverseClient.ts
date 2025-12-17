/**
 * Dataverse Client Service
 * Adapted from KF implementation for DFSA Authorised Individual form
 *
 * Key differences from KF:
 * - Uses Azure Identity SDK for token management (no fetchCRMToken)
 * - DFSA-specific entity names (dfsa_authorised_individual)
 * - Typed interfaces for DFSA data structures
 * - Enhanced error handling with typed errors
 */

import axios, { AxiosInstance } from 'axios';
import { ClientSecretCredential } from '@azure/identity';
import logger from '../../utils/logger';
import env from '../../config/env';

// Dataverse API configuration
const DATAVERSE_BASE_URL = env.DATAVERSE_URL;
const DATAVERSE_API_URL = `${DATAVERSE_BASE_URL}/api/data/${env.DATAVERSE_API_VERSION}`;

// Token cache to avoid requesting new tokens on every call
interface TokenCache {
  token: string;
  expiresOn: number;
}

let tokenCache: TokenCache | null = null;

/**
 * Get OAuth token for Dataverse API using Azure Identity
 * Implements caching to reduce token requests
 */
async function getToken(): Promise<string> {
  const requestId = `[${Date.now()}]`;

  try {
    // Check cache (with 5 minute buffer before expiry)
    if (tokenCache && tokenCache.expiresOn > Date.now() + 300000) {
      logger.debug(`${requestId} [DataverseClient] Using cached token`);
      return tokenCache.token;
    }

    logger.debug(`${requestId} [DataverseClient] Acquiring new token`);

    // Create credential
    const credential = new ClientSecretCredential(
      env.AZURE_TENANT_ID,
      env.AZURE_CLIENT_ID,
      env.AZURE_CLIENT_SECRET
    );

    // Get token for Dataverse
    const tokenResponse = await credential.getToken(
      `${DATAVERSE_BASE_URL}/.default`
    );

    // Cache token
    tokenCache = {
      token: tokenResponse.token,
      expiresOn: tokenResponse.expiresOnTimestamp
    };

    logger.info(`${requestId} [DataverseClient] Token acquired successfully`, {
      expiresOn: new Date(tokenResponse.expiresOnTimestamp).toISOString()
    });

    return tokenResponse.token;
  } catch (error) {
    logger.error(`${requestId} [DataverseClient] Failed to get token`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw new Error(`Failed to obtain Dataverse access token: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Get standard headers for Dataverse API requests
 */
function getHeaders(token: string): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'OData-Version': '4.0',
    'OData-MaxVersion': '4.0',
    'Accept': 'application/json',
    'Prefer': 'return=representation' // Return full record after create/update
  };
}

/**
 * Get a single Authorised Individual record by ID
 * Includes all related entities (passport details, citizenships, regulatory history)
 *
 * @param id - GUID of the authorised individual record
 * @returns Complete record with expanded related entities
 */
export async function getAuthorisedIndividual(id: string): Promise<any> {
  const requestId = `[${Date.now()}]`;
  logger.info(`${requestId} [DataverseClient] Fetching Authorised Individual`, { id });

  try {
    const token = await getToken();

    // Build query with all required fields and expansions
    // Based on canonical structure (71 fields + 3 related entities)
    const selectFields = [
      // Step 0.1
      'dfsa_iconfirmthatihavecarefullyreadandup',
      // Step 0.2
      'cr5f7_doyouconsenttothedisclosureoftheinformatio',
      // Step 0.3
      'dfsa_firmnamesd',
      'cr5f7_firmnumber',
      'cr5f7_nameofpersonmakingthesubmission',
      'dfsa_positiontitleofcontactperson',
      'dfsa_ai_emailaddress',
      'dfsa_contacttelephonenumber',
      'dfsa_proposedauthorisedindividualname',
      // Step 1.1 - Application Context
      'dfsa_ai_isthecandidateapplyingonbehalfofarepres',
      'dfsa_ai_pleaseindicatethefunctionsthecandidate',
      // Step 1.1 - Identity
      'dfsa_hasthecandidatepreviouslyheldauthorisedindiv',
      'cr5f7_pleaseselectcandidateup',
      'cr5f7_areyouapplyingasanmlro',
      // Step 1.1 - Other Names
      'dfsa_hasthecandidateeverusedothernamesorchanged',
      'dfsa_stateothernames',
      'dfsa_nameinnativelanguageifapplicable',
      'cr5f7_datenamechanged1',
      'dfsa_reasonforchangeofname',
      // Step 1.1 - Contact
      'dfsa_address',
      'dfsa_postcodepobox',
      'dfsa_countryauthindividual',
      'dfsa_mobiletelephonenumber',
      'dfsa_contactemailaddress',
      'cr5f7_howlonghasthecandidateresidedattheabov',
      // Step 1.1 - Previous Address
      'dfsa_buildingnamenumber',
      'dfsa_postcode_pobox',
      'dfsa_country2',
      // Step 1.1 - Licensed Functions
      'dfsa_pleaseselectthelicensedfunctiontobecarried',
      'dfsa_ml_seniorexecutiveofficer',
      'dfsa_ml_financeofficer',
      'dfsa_ml_complianceofficer1',
      'dfsa_ml_moneylaunderingreportingofficer',
      'dfsa_ml_nomandatoryfunction',
      'cr5f7_theapplicanthassignificantresponsibilityfort',
      'cr5f7_theapplicantexercisesasignificantinfluenceon',
      'cr5f7_theapplicantisnotanemployeeoftheauthorised',
      'dfsa_willthecandidatebeanexecutiveornonexecutiv',
      'dfsa_ai_willthecandidatebeanexecutiveornonexecu',
      // Step 1.1 - Position
      'dfsa_whatisthecandidatesproposedjobtitle',
      'new_ai_doyouhaveproposedstartingdate',
      'cr5f7_whatisthecandidatesproposedstartingdate',
      'new_ai_pleaseexplain',
      'dfsa_doesthecandidateholdorhaspreviouslyheldin',
      'new_ai_willthecandidateapplyingforprincipalrepre',
      // System fields
      'dfsa_authorised_individualid',
      'createdon',
      'modifiedon'
    ];

    // Build expand for related entities
    const expandFields = [
      'cr5f7_AI_Q12_CandidateInfo($select=dfsa_titlez,dfsa_nameasitappearsintheprincipalpassport,cr5f7_dateofbirth1,dfsa_dateofbirth,dfsa_placeofbirth,dfsa_uaeresident,dfsa_no,dfsa_othernames,dfsa_nameinnativelanguageifapplicable)',
      'cr5f7_dfsa_Authorised_Individual_AI_Q13_CitizenshipInfo_dfsa_ROAF_authorised_Individual_AICIQ13($select=dfsa_countryterritory,dfsa_passportno,cr5f7_expirydate1,dfsa_expirydate)',
      'cr5f7_dfsa_Authorised_Individual_AI_Q28_LicenceDetails_dfsa_ROAF_authorised_Individual_AICIQ28($select=dfsa_regulator,dfsa_datestarted,dfsa_datefinishedifapplicable,dfsa_nameoflicenseregistration,dfsa_nameoflicenseregister,dfsa_briefoverviewoflicenseregistration,dfsa_regulatorrownumberinq28pleaseprovidedet)'
    ];

    const query = `dfsa_authorised_individuals(${id})?$select=${selectFields.join(',')}&$expand=${expandFields.join(',')}`;
    const url = `${DATAVERSE_API_URL}/${query}`;

    logger.debug(`${requestId} [DataverseClient] GET ${url}`);

    const response = await axios.get(url, {
      headers: getHeaders(token),
      validateStatus: (status) => status >= 200 && status < 600
    });

    if (response.status >= 200 && response.status < 300) {
      logger.info(`${requestId} [DataverseClient] Record retrieved successfully`, {
        id,
        hasPassportDetails: !!response.data.cr5f7_AI_Q12_CandidateInfo,
        hasCitizenships: !!response.data.cr5f7_dfsa_Authorised_Individual_AI_Q13_CitizenshipInfo_dfsa_ROAF_authorised_Individual_AICIQ13,
        hasRegulatoryHistory: !!response.data.cr5f7_dfsa_Authorised_Individual_AI_Q28_LicenceDetails_dfsa_ROAF_authorised_Individual_AICIQ28
      });
      return response.data;
    } else if (response.status === 404) {
      const error: any = new Error(`Authorised Individual record not found: ${id}`);
      error.status = 404;
      throw error;
    } else {
      const error: any = new Error(`Dataverse API returned status ${response.status}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }
  } catch (error) {
    logger.error(`${requestId} [DataverseClient] Failed to fetch Authorised Individual`, {
      id,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: (error as any).status || (error as any).response?.status,
      responseData: (error as any).response?.data
    });

    // Re-throw with enhanced error message
    if (axios.isAxiosError(error)) {
      if (error.response) {
        const dataverseError: any = new Error(
          error.response.data?.error?.message ||
          `Dataverse API error: ${error.response.status} ${error.response.statusText}`
        );
        dataverseError.status = error.response.status;
        dataverseError.response = error.response.data;
        throw dataverseError;
      } else if (error.request) {
        throw new Error('No response from Dataverse API. Check network connectivity.');
      }
    }

    throw error;
  }
}

/**
 * Query Authorised Individual records with filters
 * Useful for testing and listing records
 */
export async function queryAuthorisedIndividuals(filter?: string, top: number = 10): Promise<any[]> {
  const requestId = `[${Date.now()}]`;
  logger.info(`${requestId} [DataverseClient] Querying Authorised Individuals`, { filter, top });

  try {
    const token = await getToken();

    let query = `dfsa_authorised_individuals?$top=${top}&$orderby=createdon desc`;

    if (filter) {
      query += `&$filter=${filter}`;
    }

    const url = `${DATAVERSE_API_URL}/${query}`;

    logger.debug(`${requestId} [DataverseClient] GET ${url}`);

    const response = await axios.get(url, {
      headers: getHeaders(token),
      validateStatus: (status) => status >= 200 && status < 600
    });

    if (response.status >= 200 && response.status < 300) {
      const records = response.data.value || [];
      logger.info(`${requestId} [DataverseClient] Found ${records.length} record(s)`);
      return records;
    } else if (response.status === 404) {
      logger.info(`${requestId} [DataverseClient] No records found`);
      return [];
    } else {
      const error: any = new Error(`Dataverse API returned status ${response.status}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }
  } catch (error) {
    logger.error(`${requestId} [DataverseClient] Failed to query Authorised Individuals`, {
      filter,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

export default {
  getAuthorisedIndividual,
  queryAuthorisedIndividuals,
  getToken,
  DATAVERSE_API_URL
};
