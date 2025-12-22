import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { AuthorisedIndividualDTO } from '../../types/authorisedIndividual.js';

export interface TemplateViewModel {
  // Application metadata
  application_id: string;
  generated_at: string;

  // Personal Information
  surname: string;
  given_names: string;
  other_names: string | null;
  previously_held_names: string | null;
  date_of_birth: string;
  place_of_birth: string;
  gender: string;
  nationality: string;
  marital_status: string;

  // Contact Information
  email_address: string;
  mobile_number: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postal_code: string | null;
  country: string;
  residence_duration_years: number | null;

  // Condition Flags
  has_other_names: boolean;
  has_previously_held_names: boolean;
  residence_duration_less_than_3_years: boolean;

  // Pass through DTO for template access
  dto?: AuthorisedIndividualDTO;
}

export class PDFServicePlanA {

  /**
   * Generate PDF from DTO using Plan A styling
   */
  static async generatePDF(dto: AuthorisedIndividualDTO): Promise<Buffer> {
    let browser;

    try {
      console.log('🚂 Using Puppeteer for Plan A PDF generation');

      // Launch browser with optimized settings
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-gpu'
        ],
        timeout: 30000
      });

      const page = await browser.newPage();

      // Optimize page for PDF generation
      await page.setViewport({ width: 1200, height: 800 });

      // Disable unnecessary resources
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (req.resourceType() === 'image' || req.resourceType() === 'font') {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Convert DTO to view model (PascalCase -> snake_case mapping)
      const viewModel = PDFServicePlanA.mapDtoToViewModel(dto);

      // Render template
      const htmlContent = await PDFServicePlanA.renderTemplate(viewModel);

      // Set content with timeout
      await page.setContent(htmlContent, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; width: 100%; text-align: center; margin: 0 15mm; padding: 8px 0; background-color: #B82933; color: white; font-weight: bold;">
            <strong>DFSA AUTHORISED INDIVIDUAL APPLICATION</strong>
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 9px; width: 100%; text-align: center; margin: 0 15mm; padding: 5px 0; color: #B82933; border-top: 1px solid #E5E5E5;">
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span> | Generated on ${viewModel.generated_at} | Application ID: ${viewModel.application_id}</span>
          </div>
        `
      });

      console.log(`📄 PDF generated successfully (${Math.round(pdfBuffer.length / 1024)}KB)`);

      return Buffer.from(pdfBuffer);

    } catch (error) {
      console.error('❌ PDF Generation Error:', error);
      throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Map DTO to ViewModel (snake_case) for template
   */
  private static mapDtoToViewModel(dto: AuthorisedIndividualDTO): TemplateViewModel {
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Get first passport details if available
    const firstPassport = dto.PassportDetails && dto.PassportDetails.length > 0 ? dto.PassportDetails[0] : null;

    return {
      // Application metadata
      application_id: dto.Application.Id || 'N/A',
      generated_at: formattedDate,

      // Personal Information from Passport Details
      surname: firstPassport?.FullName?.split(' ').pop() || '',
      given_names: firstPassport?.FullName?.split(' ').slice(0, -1).join(' ') || '',
      other_names: dto.Application.OtherNames?.StateOtherNames || null,
      previously_held_names: dto.Application.OtherNames?.StateOtherNames || null,
      date_of_birth: firstPassport?.DateOfBirth || '',
      place_of_birth: firstPassport?.PlaceOfBirth || '',
      gender: '', // Not in current DTO
      nationality: dto.Citizenships && dto.Citizenships.length > 0 ? dto.Citizenships[0].Country : '',
      marital_status: '', // Not in current DTO

      // Contact Information
      email_address: dto.Application.Contact.Email || '',
      mobile_number: dto.Application.Contact.Mobile || '',
      address_line1: dto.Application.Contact.Address || '',
      address_line2: null,
      city: '', // Part of Address field
      postal_code: dto.Application.Contact.PostCode || null,
      country: dto.Application.Contact.Country || '',
      residence_duration_years: null, // Calculated from ResidenceDuration

      // Condition Flags
      has_other_names: dto.Flags.OtherNames,
      has_previously_held_names: dto.Flags.PreviouslyHeld,
      residence_duration_less_than_3_years: dto.Flags.ResidenceDurationLessThan3Years,

      // Pass through DTO for template access
      dto: dto
    };
  }

  /**
   * Render Handlebars template
   */
  private static async renderTemplate(viewModel: TemplateViewModel): Promise<string> {
    try {
      const templatePath = join(process.cwd(), 'src', 'templates', 'pdf-template.hbs');
      const templateSource = await readFile(templatePath, 'utf-8');

      // Register helpers
      PDFServicePlanA.registerHelpers();

      // Compile and render
      const template = handlebars.compile(templateSource);
      return template(viewModel);

    } catch (error) {
      console.error('❌ Template Rendering Error:', error);
      throw new Error(`Template rendering failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Register Handlebars helpers
   */
  private static registerHelpers(): void {
    // Format date helper
    handlebars.registerHelper('formatDate', (dateString: string) => {
      if (!dateString) return '-';
      try {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      } catch {
        return '-';
      }
    });

    // Format boolean helper
    handlebars.registerHelper('formatBoolean', (value: boolean | number) => {
      if (value === true || value === 1) return 'Yes';
      if (value === false || value === 0) return 'No';
      return '-';
    });

    // Conditional helper
    handlebars.registerHelper('ifEquals', (arg1: any, arg2: any, options: any) => {
      return (arg1 == arg2) ? options.fn(options.data?.root) : options.inverse(options.data?.root);
    });

    // Array helper
    handlebars.registerHelper('hasItems', (array: any[], options: any) => {
      return (array && array.length > 0) ? options.fn(options.data?.root) : options.inverse(options.data?.root);
    });

    // Default value helper
    handlebars.registerHelper('defaultValue', (value: any, defaultVal: string) => {
      return value || defaultVal;
    });
  }
}
