const dataverseClient = require('./dist/services/dataverse/dataverseClient').default;

async function check() {
  const id = '18036be5-dadb-f011-8544-6045bd69d7d8';
  const record = await dataverseClient.getAuthorisedIndividual(id);
  
  console.log('RepOffice flag:', record.dfsa_ai_isthecandidateapplyingonbehalfofarepres);
  console.log('RepOffice Functions:', record.dfsa_ai_pleaseindicatethefunctionsthecandidate);
  console.log('');
  console.log('Previously Held flag:', record.dfsa_hasthecandidatepreviouslyheldauthorisedindiv);
  console.log('Candidate Lookup:', record._cr5f7_pleaseselectcandidateup_value);
}

check();
