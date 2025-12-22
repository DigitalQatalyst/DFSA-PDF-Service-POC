// ============================================================
// Stage Progress Indicator
// ============================================================
$(document).ready(function() {
    $("table[data-name='title_general_information']").before(
        "<div id='pathStep'><ol start='0' class='stages'>" +
        "<li class='stage'><span>Introduction</span><br></li>" +
        "<li class='stage'><span>General Information</span><br></li>" +
        "<li class='stage'><span>Specific Information</span><br></li>" +
        "<li class='stage active'><span>Common Information</span></li>" +
        "</ol></div>"
    );
});

// ============================================================
// Next Button Visibility Control
// ============================================================
$(document).ready(function () {
    var button = $('#NextButton');
    var baseUrl = window.location.origin + '/_api/contacts({{user.id}})';

    button.hide();

    $.getJSON(baseUrl)
        .done(function (response) {
            if (response.dfsa_usertype && response.dfsa_usertype === 356960000) {
                return; // Keep button hidden
            }
            button.show();
        })
        .fail(function (error) {
            console.error('Error fetching user type:', error);
        });
});

// ============================================================
// PDF Download Button Setup & Styling
// ============================================================
$(document).ready(function () {
    // Add PDF button to page
    $('.actions .col-md-6').append(
        '<div role="group" class="btn-group entity-action-button" style="margin-left: 20px;">' +
        '<button type="button" class="btn button pdf-btn">' +
        '<i class="fa fa-download" aria-hidden="true"></i> Download PDF' +
        '</button></div>'
    );

    // Add button styles
    $('<style>')
        .prop('type', 'text/css')
        .html(`
            .pdf-btn {
                background-color: #a29061 !important;
                border-color: #a29061 !important;
                color: #fff !important;
            }
            .pdf-btn:hover, .pdf-btn:focus, .pdf-btn:active {
                background-color: #bf2e1a !important;
                border-color: #bf2e1a !important;
                color: #fff !important;
            }
            .pdf-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed !important;
            }
        `)
        .appendTo('head');
});

// ============================================================
// PDF Generation Integration
// ============================================================
$(document).ready(function() {
    console.log('[PDF] Integration script loaded');
    console.log('[PDF] Config available:', typeof window.PDF_CONFIG !== 'undefined');

    // Get record ID from URL
    function getRecordId() {
        var urlParams = new URLSearchParams(window.location.search);
        var id = urlParams.get('id');
        console.log('[PDF] Record ID from URL:', id);
        return id;
    }

    // Download DOCX file directly
    function downloadDocx(recordId, $button) {
        console.log('[PDF] Starting DOCX download for:', recordId);

        var originalHtml = $button.html();

        $button.prop('disabled', true)
               .html('<i class="fa fa-spinner fa-spin"></i> Generating DOCX...');

        // Check config
        if (!window.PDF_CONFIG || !window.PDF_CONFIG.apiEndpoint) {
            console.error('[PDF] Config missing');
            alert('PDF service not configured. Please contact administrator.');
            $button.prop('disabled', false).html(originalHtml);
            return;
        }

        var docxEndpoint = window.PDF_CONFIG.apiEndpoint.replace('/generate', '/generate-docx');
        console.log('[PDF] Calling endpoint:', docxEndpoint);

        fetch(docxEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + window.PDF_CONFIG.apiKey
            },
            body: JSON.stringify({ recordId: recordId })
        })
        .then(function(response) {
            console.log('[PDF] Response status:', response.status);
            if (!response.ok) {
                return response.json().then(function(err) {
                    throw new Error(err.message || 'Failed to generate DOCX');
                });
            }
            return response.blob();
        })
        .then(function(blob) {
            console.log('[PDF] DOCX blob received, size:', blob.size);

            // Create download link
            var url = window.URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'AuthorisedIndividual_' + recordId + '_' + new Date().toISOString().split('T')[0] + '.docx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();

            alert('DOCX file downloaded successfully!');
        })
        .catch(function(error) {
            console.error('[DOCX Download] Error:', error);
            alert('Failed to download DOCX: ' + error.message);
        })
        .finally(function() {
            $button.prop('disabled', false).html(originalHtml);
        });
    }

    // Generate PDF and update Dataverse
    function generatePdf(recordId, $button) {
        console.log('[PDF] Starting PDF generation for:', recordId);

        var originalHtml = $button.html();

        $button.prop('disabled', true)
               .html('<i class="fa fa-spinner fa-spin"></i> Generating PDF...');

        // Check config
        if (!window.PDF_CONFIG || !window.PDF_CONFIG.apiEndpoint) {
            console.error('[PDF] Config missing');
            alert('PDF service not configured. Please contact administrator.');
            $button.prop('disabled', false).html(originalHtml);
            return;
        }

        console.log('[PDF] Calling endpoint:', window.PDF_CONFIG.apiEndpoint);

        fetch(window.PDF_CONFIG.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + window.PDF_CONFIG.apiKey
            },
            body: JSON.stringify({ recordId: recordId })
        })
        .then(function(response) {
            console.log('[PDF] Response status:', response.status);
            return response.json();
        })
        .then(function(data) {
            console.log('[PDF] Response data:', data);

            if (data.success) {
                // Check if we have webapi
                if (typeof webapi === 'undefined') {
                    console.warn('[PDF] webapi not available');
                    alert('PDF generated successfully!\n\nPDF URL: ' + data.pdfUrl);
                    if (data.pdfUrl && data.pdfUrl !== 'storage://not-configured') {
                        window.open(data.pdfUrl, '_blank');
                    }
                    $button.prop('disabled', false).html(originalHtml);
                    return;
                }

                // Update Dataverse with PDF URL
                webapi.safeAjax({
                    type: "PATCH",
                    url: "/_api/dfsa_authorised_individuals(" + recordId + ")",
                    contentType: "application/json",
                    data: JSON.stringify({
                        "dfsa_pdf_url": data.pdfUrl,
                        "dfsa_pdf_generated_date": new Date().toISOString()
                    }),
                    success: function() {
                        console.log('[PDF] Dataverse updated successfully');
                        alert("PDF generated successfully!");
                        if (data.pdfUrl && data.pdfUrl !== 'storage://not-configured') {
                            window.open(data.pdfUrl, '_blank');
                        } else {
                            alert('Note: PDF was generated but Azure Storage is not configured.\n\nPlease configure Azure Blob Storage to persist PDFs.');
                        }
                    },
                    error: function(xhr) {
                        console.error('[Dataverse Update] Error:', xhr);
                        alert('PDF generated but failed to update record. PDF URL: ' + data.pdfUrl);
                        if (data.pdfUrl && data.pdfUrl !== 'storage://not-configured') {
                            window.open(data.pdfUrl, '_blank');
                        }
                    }
                });
            } else {
                throw new Error(data.error || data.message || 'PDF generation failed');
            }
        })
        .catch(function(error) {
            console.error('[PDF] Error:', error);
            alert('Failed to generate PDF: ' + error.message);
        })
        .finally(function() {
            $button.prop('disabled', false).html(originalHtml);
        });
    }

    // Attach click handler to PDF button
    // IMPORTANT: Use event delegation to ensure it works even if button is added dynamically
    $(document).on('click', '.pdf-btn', function(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent form submission

        console.log('[PDF] Button clicked');

        var recordId = getRecordId();
        if (!recordId) {
            console.error('[PDF] No record ID found');
            alert("Error: Could not find application record. Please try again.");
            return;
        }

        // Choose which function to call based on your preference
        // Option 1: Download DOCX (works immediately, no Azure Storage needed)
        downloadDocx(recordId, $(this));

        // Option 2: Generate PDF (requires Azure Blob Storage to be configured)
        // generatePdf(recordId, $(this));
    });

    console.log('[PDF] Click handlers attached');
});
