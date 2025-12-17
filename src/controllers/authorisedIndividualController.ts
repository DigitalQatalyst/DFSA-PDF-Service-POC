/**
 * Authorised Individual Controller
 * POC Demonstration Endpoints
 *
 * Key Demonstrations:
 * 1. Fetch record from Dataverse
 * 2. Map using canonical structure
 * 3. Show conditional logic in action
 */

import { Request, Response } from 'express';
import logger from '../utils/logger';
import dataverseClient from '../services/dataverse/dataverseClient';
import { mapToDTO } from '../mappers/authorisedIndividualMapper';

/**
 * GET /api/v1/authorised-individual/:id
 *
 * Fetches Authorised Individual record and returns mapped DTO
 * This demonstrates:
 * - Dataverse integration
 * - Canonical mapping
 * - Conditional flag evaluation
 */
export async function getAuthorisedIndividual(req: Request, res: Response): Promise<void> {
  const requestId = req.id || `[${Date.now()}]`;
  const { id } = req.params;

  logger.info(`${requestId} [Controller] GET Authorised Individual`, { id });

  try {
    // Validate GUID format
    const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidPattern.test(id)) {
      logger.warn(`${requestId} [Controller] Invalid GUID format`, { id });
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid ID format. Expected GUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
      });
      return;
    }

    // Step 1: Fetch from Dataverse
    logger.info(`${requestId} [Controller] Fetching from Dataverse...`);
    const dataverseRecord = await dataverseClient.getAuthorisedIndividual(id);

    // Step 2: Map to canonical DTO
    logger.info(`${requestId} [Controller] Mapping to canonical DTO...`);
    const dto = mapToDTO(dataverseRecord);

    // Step 3: Return mapped data
    logger.info(`${requestId} [Controller] Successfully mapped and returning DTO`);

    res.status(200).json({
      success: true,
      data: dto,
      metadata: {
        recordId: id,
        fetchedAt: new Date().toISOString(),
        conditionalSections: {
          showPreviousAddress: dto.Flags.ResidenceDurationLessThan3Years,
          showOtherNames: dto.Flags.OtherNames,
          showLicensedFunctions: dto.LicensedFunctions.ShowLicensedFunctionsSection,
          showRegulatoryHistory: dto.Flags.HasRegulatoryHistory
        },
        repeatingSections: {
          passportDetailsCount: dto.PassportDetails.length,
          citizenshipsCount: dto.Citizenships.length,
          regulatoryHistoryCount: dto.RegulatoryHistory.length
        }
      }
    });
  } catch (error: any) {
    logger.error(`${requestId} [Controller] Failed to get Authorised Individual`, {
      id,
      error: error.message || error,
      status: error.status || error.response?.status
    });

    // Handle specific errors
    if (error.status === 404) {
      res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Authorised Individual record not found: ${id}`
      });
      return;
    }

    if (error.status === 401 || error.response?.status === 401) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Failed to authenticate with Dataverse. Check credentials.'
      });
      return;
    }

    const statusCode = error.status || error.response?.status || 500;
    res.status(statusCode).json({
      success: false,
      error: 'Error',
      message: error.message || 'Failed to fetch Authorised Individual data'
    });
  }
}

/**
 * GET /api/v1/authorised-individual/:id/conditional-demo
 *
 * Special POC endpoint that demonstrates conditional logic
 * Returns detailed breakdown of why each section is shown/hidden
 */
export async function getConditionalDemo(req: Request, res: Response): Promise<void> {
  const requestId = req.id || `[${Date.now()}]`;
  const { id } = req.params;

  logger.info(`${requestId} [Controller] GET Conditional Demo`, { id });

  try {
    // Validate GUID
    const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidPattern.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Invalid ID format'
      });
      return;
    }

    // Fetch and map
    const dataverseRecord = await dataverseClient.getAuthorisedIndividual(id);
    const dto = mapToDTO(dataverseRecord);

    // Build conditional logic explanation
    const conditionalExplanation = {
      flags: dto.Flags,
      sections: [
        {
          sectionCode: 'AUTH_PREV_ADDRESS',
          sectionName: 'Previous Address',
          visible: dto.Flags.ResidenceDurationLessThan3Years,
          reason: dto.Flags.ResidenceDurationLessThan3Years
            ? 'Candidate has lived at current address for less than 3 years'
            : 'Candidate has lived at current address for 3 years or more',
          dataverseValue: dataverseRecord.cr5f7_howlonghasthecandidateresidedattheabov,
          dataverseField: 'cr5f7_howlonghasthecandidateresidedattheabov',
          expectedValue: 612320000,
          actualData: dto.Application.PreviousAddress
        },
        {
          sectionCode: 'AUTH_OTHER_NAMES',
          sectionName: 'Other Names',
          visible: dto.Flags.OtherNames,
          reason: dto.Flags.OtherNames
            ? 'Candidate has used other names or changed names'
            : 'Candidate has not used other names',
          dataverseValue: dataverseRecord.dfsa_hasthecandidateeverusedothernamesorchanged,
          dataverseField: 'dfsa_hasthecandidateeverusedothernamesorchanged',
          expectedValue: true,
          actualData: dto.Application.OtherNames
        },
        {
          sectionCode: 'AUTH_LIC_FUNC',
          sectionName: 'Licensed Functions',
          visible: dto.LicensedFunctions.ShowLicensedFunctionsSection,
          reason: dto.Flags.RepOffice
            ? 'HIDDEN: Candidate is applying for Representative Office'
            : 'SHOWN: Candidate is not applying for Representative Office',
          dataverseValue: dataverseRecord.dfsa_ai_isthecandidateapplyingonbehalfofarepres,
          dataverseField: 'dfsa_ai_isthecandidateapplyingonbehalfofarepres',
          expectedValue: false,
          actualData: dto.LicensedFunctions
        },
        {
          sectionCode: 'AUTH_REG_HISTORY',
          sectionName: 'Regulatory History',
          visible: dto.Flags.HasRegulatoryHistory,
          reason: dto.Flags.HasRegulatoryHistory
            ? 'Candidate holds or has held regulatory license'
            : 'Candidate has no regulatory history',
          dataverseValue: dataverseRecord.dfsa_doesthecandidateholdorhaspreviouslyheldin,
          dataverseField: 'dfsa_doesthecandidateholdorhaspreviouslyheldin',
          expectedValue: true,
          actualData: dto.RegulatoryHistory,
          recordCount: dto.RegulatoryHistory.length
        },
        {
          sectionCode: 'AUTH_POSITION_START_DATE',
          sectionName: 'Proposed Start Date vs Explanation',
          visible: dto.Flags.HasStartDate,
          reason: dto.Flags.HasStartDate
            ? 'Candidate has proposed start date - showing date field'
            : 'Candidate does not have start date - showing explanation field',
          dataverseValue: dataverseRecord.new_ai_doyouhaveproposedstartingdate,
          dataverseField: 'new_ai_doyouhaveproposedstartingdate',
          expectedValue: true,
          actualData: dto.Position
        }
      ],
      repeatingSections: {
        passportDetails: {
          count: dto.PassportDetails.length,
          records: dto.PassportDetails
        },
        citizenships: {
          count: dto.Citizenships.length,
          records: dto.Citizenships
        },
        regulatoryHistory: {
          count: dto.RegulatoryHistory.length,
          records: dto.RegulatoryHistory,
          note: 'Only populated if HasRegulatoryHistory flag = true'
        }
      }
    };

    res.status(200).json({
      success: true,
      message: 'Conditional logic demonstration',
      explanation: conditionalExplanation,
      fullDTO: dto
    });
  } catch (error: any) {
    logger.error(`${requestId} [Controller] Conditional demo failed`, {
      id,
      error: error.message || error
    });

    res.status(error.status || 500).json({
      success: false,
      error: 'Error',
      message: error.message || 'Failed to generate conditional demo'
    });
  }
}

/**
 * GET /api/v1/authorised-individual/list
 *
 * List recent Authorised Individual records
 * Useful for finding test record IDs
 */
export async function listAuthorisedIndividuals(req: Request, res: Response): Promise<void> {
  const requestId = req.id || `[${Date.now()}]`;

  logger.info(`${requestId} [Controller] LIST Authorised Individuals`);

  try {
    const records = await dataverseClient.queryAuthorisedIndividuals(undefined, 10);

    const summary = records.map(record => ({
      id: record.dfsa_authorised_individualid,
      name: record.dfsa_proposedauthorisedindividualname,
      firmName: record.dfsa_firmnamesd,
      createdOn: record.createdon,
      modifiedOn: record.modifiedon
    }));

    res.status(200).json({
      success: true,
      count: summary.length,
      records: summary,
      message: 'Use one of these IDs to test GET /api/v1/authorised-individual/:id'
    });
  } catch (error: any) {
    logger.error(`${requestId} [Controller] List failed`, {
      error: error.message || error
    });

    res.status(error.status || 500).json({
      success: false,
      error: 'Error',
      message: error.message || 'Failed to list records'
    });
  }
}

export default {
  getAuthorisedIndividual,
  getConditionalDemo,
  listAuthorisedIndividuals
};
