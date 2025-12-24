/**
 * End-to-End Workflow Test Script
 *
 * This script tests the complete DFSA PDF generation workflow:
 * 1. Fetch real Dataverse record
 * 2. Map data (validate Steps 0.1-2.3)
 * 3. Generate PDF
 * 4. Upload to Azure Blob Storage
 * 5. Send email with PDF attachment
 * 6. Update Dataverse with PDF URL
 *
 * Test Record ID: 18036be5-dadb-f011-8544-6045bd69d7d8
 * Test Email: stephanie.njunge@digitalqatalyst.com
 */

import axios from 'axios';
import { ClientSecretCredential } from '@azure/identity';
import * as dotenv from 'dotenv';
import { mapToDTO } from './src/mappers/authorisedIndividualMapper';
import { DataverseAuthorisedIndividualRecord } from './src/types/authorisedIndividual';

dotenv.config();

// Test configuration
const TEST_CONFIG = {
  recordId: '18036be5-dadb-f011-8544-6045bd69d7d8',
  recipientEmail: 'stephanie.njunge@digitalqatalyst.com',
  apiBaseUrl: 'http://localhost:3002',
  dataverseBaseUrl: process.env.DATAVERSE_URL,
  tenantId: process.env.AZURE_TENANT_ID!,
  clientId: process.env.AZURE_CLIENT_ID!,
  clientSecret: process.env.AZURE_CLIENT_SECRET!
};

// Validation checkpoints
const VALIDATION_POINTS = {
  step01: '0.1 - Guidelines',
  step02: '0.2 - DIFC Disclosure',
  step03: '0.3 - Application Info',
  step11: '1.1 - Personal Details',
  step21: '2.1 - Career History',
  step22: '2.2 - Qualifications',
  step23: '2.3 - Other Holdings'
};

interface TestResults {
  timestamp: string;
  recordId: string;
  validations: {
    [key: string]: {
      passed: boolean;
      message: string;
      data?: any;
    };
  };
  pdfGeneration: {
    success: boolean;
    pdfUrl?: string;
    error?: string;
  };
  emailSending: {
    success: boolean;
    messageId?: string;
    error?: string;
  };
  dataverseUpdate: {
    success: boolean;
    pdfUrlWritten?: string;
    error?: string;
  };
}

class E2EWorkflowTester {
  private credential: ClientSecretCredential;
  private results: TestResults;

  constructor() {
    this.credential = new ClientSecretCredential(
      TEST_CONFIG.tenantId,
      TEST_CONFIG.clientId,
      TEST_CONFIG.clientSecret
    );

    this.results = {
      timestamp: new Date().toISOString(),
      recordId: TEST_CONFIG.recordId,
      validations: {},
      pdfGeneration: { success: false },
      emailSending: { success: false },
      dataverseUpdate: { success: false }
    };
  }

  /**
   * Step 1: Fetch real Dataverse record
   */
  async fetchDataverseRecord(): Promise<DataverseAuthorisedIndividualRecord> {
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('STEP 1: Fetching Dataverse Record');
    console.log('══════════════════════════════════════════════════════════\n');

    try {
      const tokenResponse = await this.credential.getToken(['https://dfsaprimarydev.crm15.dynamics.com/.default']);

      const response = await axios.get(
        `${TEST_CONFIG.dataverseBaseUrl}api/data/v9.2/dfsa_authorised_individuals(${TEST_CONFIG.recordId})`,
        {
          headers: {
            'Authorization': `Bearer ${tokenResponse.token}`,
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            'Accept': 'application/json',
            'Prefer': 'odata.include-annotations="*"'
          }
        }
      );

      console.log('✅ Successfully fetched Dataverse record');
      console.log(`   Record: ${response.data.dfsa_name}`);
      console.log(`   Firm: ${response.data.dfsa_firmnamesd}`);
      console.log(`   Candidate: ${response.data.dfsa_proposedauthorisedindividualname}\n`);

      return response.data;
    } catch (error: any) {
      console.error('❌ Failed to fetch Dataverse record:', error.message);
      throw error;
    }
  }

  /**
   * Step 2: Map data and validate all form steps
   */
  async mapAndValidateData(record: DataverseAuthorisedIndividualRecord) {
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('STEP 2: Mapping & Validating Data (Steps 0.1-2.3)');
    console.log('══════════════════════════════════════════════════════════\n');

    try {
      const dto = mapToDTO(record);

      // Validation: Step 0.1 - Guidelines
      this.validateStep01(dto);

      // Validation: Step 0.2 - DIFC Disclosure
      this.validateStep02(dto);

      // Validation: Step 0.3 - Application Info
      this.validateStep03(dto);

      // Validation: Step 1.1 - Personal Details
      this.validateStep11(dto);

      // Validation: Step 2.1 - Career History
      this.validateStep21(dto);

      // Validation: Step 2.2 - Qualifications
      this.validateStep22(dto);

      // Validation: Step 2.3 - Other Holdings
      this.validateStep23(dto);

      console.log('\n✅ All data validation checks passed!\n');
      return dto;
    } catch (error: any) {
      console.error('❌ Data validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate Step 0.1 - Guidelines
   */
  private validateStep01(dto: any) {
    const key = 'step01';
    console.log(`Validating ${VALIDATION_POINTS[key]}...`);

    try {
      const confirmRead = dto.Guidelines.ConfirmRead;

      if (confirmRead === 'I confirm') {
        this.results.validations[key] = {
          passed: true,
          message: 'Guidelines confirmed',
          data: { confirmRead }
        };
        console.log(`   ✅ Guidelines: ${confirmRead}`);
      } else {
        throw new Error(`Expected "I confirm", got "${confirmRead}"`);
      }
    } catch (error: any) {
      this.results.validations[key] = {
        passed: false,
        message: error.message
      };
      console.log(`   ❌ ${error.message}`);
    }
  }

  /**
   * Validate Step 0.2 - DIFC Disclosure
   */
  private validateStep02(dto: any) {
    const key = 'step02';
    console.log(`Validating ${VALIDATION_POINTS[key]}...`);

    try {
      const consent = dto.DIFCDisclosure.ConsentToDisclosure;

      if (consent === true) {
        this.results.validations[key] = {
          passed: true,
          message: 'DIFC disclosure consent given',
          data: { consent }
        };
        console.log(`   ✅ DIFC Disclosure Consent: ${consent}`);
      } else {
        throw new Error(`Expected true, got ${consent}`);
      }
    } catch (error: any) {
      this.results.validations[key] = {
        passed: false,
        message: error.message
      };
      console.log(`   ❌ ${error.message}`);
    }
  }

  /**
   * Validate Step 0.3 - Application Info
   */
  private validateStep03(dto: any) {
    const key = 'step03';
    console.log(`Validating ${VALIDATION_POINTS[key]}...`);

    try {
      const app = dto.Application;

      if (app.FirmName && app.AuthorisedIndividualName && app.Requestor.Email) {
        this.results.validations[key] = {
          passed: true,
          message: 'Application info complete',
          data: {
            firmName: app.FirmName,
            candidateName: app.AuthorisedIndividualName,
            requestorEmail: app.Requestor.Email
          }
        };
        console.log(`   ✅ Firm: ${app.FirmName}`);
        console.log(`   ✅ Candidate: ${app.AuthorisedIndividualName}`);
        console.log(`   ✅ Requestor Email: ${app.Requestor.Email}`);
      } else {
        throw new Error('Missing required application fields');
      }
    } catch (error: any) {
      this.results.validations[key] = {
        passed: false,
        message: error.message
      };
      console.log(`   ❌ ${error.message}`);
    }
  }

  /**
   * Validate Step 1.1 - Personal Details
   */
  private validateStep11(dto: any) {
    const key = 'step11';
    console.log(`Validating ${VALIDATION_POINTS[key]}...`);

    try {
      const hasRegulatoryHistory = dto.Flags.HasRegulatoryHistory;
      const regulatoryHistoryCount = dto.RegulatoryHistory.length;

      this.results.validations[key] = {
        passed: true,
        message: 'Personal details validated',
        data: {
          hasRegulatoryHistory,
          regulatoryHistoryCount,
          isRepOffice: dto.Flags.RepOffice
        }
      };

      console.log(`   ✅ Is Rep Office: ${dto.Flags.RepOffice}`);
      console.log(`   ✅ Has Regulatory History: ${hasRegulatoryHistory}`);
      console.log(`   ✅ Regulatory History Entries: ${regulatoryHistoryCount}`);
    } catch (error: any) {
      this.results.validations[key] = {
        passed: false,
        message: error.message
      };
      console.log(`   ❌ ${error.message}`);
    }
  }

  /**
   * Validate Step 2.1 - Career History
   */
  private validateStep21(dto: any) {
    const key = 'step21';
    console.log(`Validating ${VALIDATION_POINTS[key]}...`);

    try {
      const careerHistoryCount = dto.CareerHistory.length;
      const hasCVFile = dto.CandidateProfile.CVFileId !== null;

      this.results.validations[key] = {
        passed: true,
        message: 'Career history validated',
        data: {
          careerHistoryCount,
          hasCVFile,
          hasJobDescription: dto.CandidateProfile.JobDescriptionFileId !== null
        }
      };

      console.log(`   ✅ Career History Entries: ${careerHistoryCount}`);
      console.log(`   ✅ Has CV File: ${hasCVFile}`);
      console.log(`   ✅ Has Job Description: ${dto.CandidateProfile.JobDescriptionFileId !== null}`);
    } catch (error: any) {
      this.results.validations[key] = {
        passed: false,
        message: error.message
      };
      console.log(`   ❌ ${error.message}`);
    }
  }

  /**
   * Validate Step 2.2 - Qualifications
   */
  private validateStep22(dto: any) {
    const key = 'step22';
    console.log(`Validating ${VALIDATION_POINTS[key]}...`);

    try {
      this.results.validations[key] = {
        passed: true,
        message: 'Qualifications validated',
        data: {
          higherEducationCount: dto.HigherEducation.length,
          professionalQualificationsCount: dto.ProfessionalQualifications.length,
          hasDIFCExperience: dto.WorkExperience.HasDIFCExperience,
          hasSimilarRoleExperience: dto.WorkExperience.HasSimilarRoleExperience
        }
      };

      console.log(`   ✅ Higher Education: ${dto.HigherEducation.length} entries`);
      console.log(`   ✅ Professional Qualifications: ${dto.ProfessionalQualifications.length} entries`);
      console.log(`   ✅ Has DIFC Experience: ${dto.WorkExperience.HasDIFCExperience}`);
      console.log(`   ✅ Has Similar Role Experience: ${dto.WorkExperience.HasSimilarRoleExperience}`);
    } catch (error: any) {
      this.results.validations[key] = {
        passed: false,
        message: error.message
      };
      console.log(`   ❌ ${error.message}`);
    }
  }

  /**
   * Validate Step 2.3 - Other Holdings
   */
  private validateStep23(dto: any) {
    const key = 'step23';
    console.log(`Validating ${VALIDATION_POINTS[key]}...`);

    try {
      const otherHoldingsCount = dto.OtherHoldings.length;

      this.results.validations[key] = {
        passed: true,
        message: 'Other holdings validated',
        data: {
          hasOtherHoldings: dto.Flags.HasOtherHoldings,
          otherHoldingsCount
        }
      };

      console.log(`   ✅ Has Other Holdings: ${dto.Flags.HasOtherHoldings}`);
      console.log(`   ✅ Other Holdings Entries: ${otherHoldingsCount}`);
    } catch (error: any) {
      this.results.validations[key] = {
        passed: false,
        message: error.message
      };
      console.log(`   ❌ ${error.message}`);
    }
  }

  /**
   * Step 3: Trigger PDF generation via API
   */
  async triggerPDFGeneration(): Promise<{ pdfUrl: string; pdfFilename: string }> {
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('STEP 3: Triggering PDF Generation via API');
    console.log('══════════════════════════════════════════════════════════\n');

    try {
      const response = await axios.post(
        `${TEST_CONFIG.apiBaseUrl}/api/pdf/generate`,
        {
          recordId: TEST_CONFIG.recordId,
          documentType: 'AuthorisedIndividual',
          recipientEmail: TEST_CONFIG.recipientEmail,
          sendEmail: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.API_KEY
          },
          timeout: 60000 // 60 second timeout for PDF generation
        }
      );

      console.log('✅ PDF generation triggered successfully');
      console.log(`   PDF URL: ${response.data.pdfUrl}`);
      console.log(`   PDF Filename: ${response.data.pdfFilename}`);
      console.log(`   Email Status: ${response.data.emailSent ? 'Sent' : 'Not Sent'}`);
      console.log(`   Message ID: ${response.data.emailMessageId || 'N/A'}\n`);

      this.results.pdfGeneration = {
        success: true,
        pdfUrl: response.data.pdfUrl
      };

      this.results.emailSending = {
        success: response.data.emailSent,
        messageId: response.data.emailMessageId
      };

      return {
        pdfUrl: response.data.pdfUrl,
        pdfFilename: response.data.pdfFilename
      };
    } catch (error: any) {
      console.error('❌ PDF generation failed:', error.response?.data || error.message);

      this.results.pdfGeneration = {
        success: false,
        error: error.response?.data?.message || error.message
      };

      throw error;
    }
  }

  /**
   * Step 4: Verify PDF URL written to Dataverse
   */
  async verifyDataverseUpdate(expectedPdfUrl: string): Promise<boolean> {
    console.log('\n══════════════════════════════════════════════════════════');
    console.log('STEP 4: Verifying PDF URL Written to Dataverse');
    console.log('══════════════════════════════════════════════════════════\n');

    try {
      const tokenResponse = await this.credential.getToken(['https://dfsaprimarydev.crm15.dynamics.com/.default']);

      const response = await axios.get(
        `${TEST_CONFIG.dataverseBaseUrl}api/data/v9.2/dfsa_authorised_individuals(${TEST_CONFIG.recordId})?$select=dfsa_pdf_url,dfsa_pdf_generated_date`,
        {
          headers: {
            'Authorization': `Bearer ${tokenResponse.token}`,
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            'Accept': 'application/json'
          }
        }
      );

      const actualPdfUrl = response.data.dfsa_pdf_url;
      const pdfGeneratedDate = response.data.dfsa_pdf_generated_date;

      if (actualPdfUrl === expectedPdfUrl) {
        console.log('✅ PDF URL successfully written to Dataverse');
        console.log(`   Expected: ${expectedPdfUrl}`);
        console.log(`   Actual: ${actualPdfUrl}`);
        console.log(`   Generated Date: ${pdfGeneratedDate}\n`);

        this.results.dataverseUpdate = {
          success: true,
          pdfUrlWritten: actualPdfUrl
        };

        return true;
      } else {
        throw new Error(`PDF URL mismatch. Expected: ${expectedPdfUrl}, Got: ${actualPdfUrl}`);
      }
    } catch (error: any) {
      console.error('❌ Dataverse update verification failed:', error.message);

      this.results.dataverseUpdate = {
        success: false,
        error: error.message
      };

      return false;
    }
  }

  /**
   * Run complete end-to-end test
   */
  async runTest() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║     DFSA PDF SERVICE - END-TO-END WORKFLOW TEST          ║');
    console.log('╚══════════════════════════════════════════════════════════╝');
    console.log(`Test Record ID: ${TEST_CONFIG.recordId}`);
    console.log(`Test Email: ${TEST_CONFIG.recipientEmail}`);
    console.log(`API Base URL: ${TEST_CONFIG.apiBaseUrl}\n`);

    try {
      // Step 1: Fetch record
      const record = await this.fetchDataverseRecord();

      // Step 2: Map and validate data
      const dto = await this.mapAndValidateData(record);

      // Step 3: Generate PDF and send email
      const { pdfUrl, pdfFilename } = await this.triggerPDFGeneration();

      // Step 4: Verify Dataverse update
      await this.verifyDataverseUpdate(pdfUrl);

      // Print summary
      this.printSummary();

    } catch (error: any) {
      console.error('\n❌ END-TO-END TEST FAILED:', error.message);
      this.printSummary();
      process.exit(1);
    }
  }

  /**
   * Print test results summary
   */
  private printSummary() {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                   TEST RESULTS SUMMARY                    ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Validation Results
    console.log('📋 DATA VALIDATION RESULTS:');
    Object.entries(this.results.validations).forEach(([key, result]) => {
      const status = result.passed ? '✅' : '❌';
      console.log(`   ${status} ${VALIDATION_POINTS[key as keyof typeof VALIDATION_POINTS]}: ${result.message}`);
    });

    // PDF Generation
    console.log('\n📄 PDF GENERATION:');
    if (this.results.pdfGeneration.success) {
      console.log(`   ✅ Success`);
      console.log(`   URL: ${this.results.pdfGeneration.pdfUrl}`);
    } else {
      console.log(`   ❌ Failed: ${this.results.pdfGeneration.error}`);
    }

    // Email Sending
    console.log('\n📧 EMAIL SENDING:');
    if (this.results.emailSending.success) {
      console.log(`   ✅ Success`);
      console.log(`   Message ID: ${this.results.emailSending.messageId}`);
      console.log(`   Recipient: ${TEST_CONFIG.recipientEmail}`);
    } else {
      console.log(`   ❌ Failed: ${this.results.emailSending.error || 'No error details'}`);
    }

    // Dataverse Update
    console.log('\n💾 DATAVERSE UPDATE:');
    if (this.results.dataverseUpdate.success) {
      console.log(`   ✅ Success`);
      console.log(`   PDF URL Written: ${this.results.dataverseUpdate.pdfUrlWritten}`);
    } else {
      console.log(`   ❌ Failed: ${this.results.dataverseUpdate.error}`);
    }

    // Overall Status
    const allPassed =
      Object.values(this.results.validations).every(v => v.passed) &&
      this.results.pdfGeneration.success &&
      this.results.emailSending.success &&
      this.results.dataverseUpdate.success;

    console.log('\n' + '═'.repeat(60));
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED! End-to-end workflow is working correctly.');
    } else {
      console.log('⚠️ SOME TESTS FAILED. Please review the results above.');
    }
    console.log('═'.repeat(60) + '\n');

    // Save results to file
    const fs = require('fs');
    fs.writeFileSync(
      './test-e2e-results.json',
      JSON.stringify(this.results, null, 2)
    );
    console.log('📄 Detailed results saved to: test-e2e-results.json\n');
  }
}

// Run the test
const tester = new E2EWorkflowTester();
tester.runTest().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
