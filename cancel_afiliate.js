/****************************************************************************
 *
 *  Sweet Leads Empreendimentos Digitais
 *  https://sweetleads.com.br
 *  felipe@sweetleads.com.br
 * 
 *  SCRIPT DE AFILIAÇÃO CANCELADA
 * 
 *  Script que checa se a planilha contém informações.
 *  Caso positivo, verificará o produto da planilha se contém alguma campanha com o mesmo nome do produto. 
 *  Se houver campanha ativa, ela será pausada e o email de notificação será enviado.
 *  obs: utilizado regex para extrair o nome do produto a partir do nome da campanha no google ads
 * 
 ****************************************************************************/

//array com condições dos anuncios
ADS_CONDITIONS =
  ["CampaignStatus = ENABLED"
    , "AdGroupStatus = ENABLED"
    , "Status = ENABLED"
  ];

//e-mail destinatário
NOTIF_EMAIL = "felipe@sweetleads.com.br"

LIST_SS_ID = "1F7L4DdGDkcUg72BPN-f3JHDeAJ_ft7seDnsI6NYgf2s"

EMAIL_SUBJECT = "Afiliação cancelada e Campanha pausada"

function main() {

  var list = getList(LIST_SS_ID)

  //var affiliationCanceled = notNil(list) ? true : false;

  if (!isEmptyObject(list)) {

    Logger.log("não vazio");
    var results = getAds(ADS_CONDITIONS, list)
      .map(pauseCampaign);

    Logger.log("*************pausadas****************");
    Logger.log(JSON.stringify(results))
    Logger.log("*************pausadas****************");

    var shouldNotify = notNil(results) ? true : false;

    if (shouldNotify) {
      var emailBody = composeEmail(results)
      MailApp.sendEmail(NOTIF_EMAIL, EMAIL_SUBJECT, emailBody, { noReply: true });
    }

  }else{
    Logger.log("Nenhuma afiliação foi cancelada");
  }


}

function isEmptyObject(obj) {
  return obj.toSource() === "[]";

}

function getList(ssId) {
  return SpreadsheetApp
    .openById(ssId)
    .getDataRange()
    .getValues()
    .reduce(function (acc, row) { return acc.concat(row) })
    .filter(function (x) { return x.length > 0 })
}

function notIn(list, el) {
  return list.indexOf(el) < 0;
}

function inSheet(list, el) {
  return list.indexOf(el) > -1;
}

function getAds(conds, list) {

  var ads = [];

  var rawAdsIt = AdsApp.ads();

  var adsIt = conds
    .reduce(function (acc, cond) { return acc.withCondition(cond) }, rawAdsIt)
    .get();

  while (adsIt.hasNext()) {

    var current = adsIt.next();
    var campaign = current.getCampaign();
    var campaignID = campaign.getId();
    var productName = campaign.getName().match(/(?!.*])(?!\ )(.*)/gm)[0];

    //var productID = campaign.getName().match(/(([0-9]+))/gm)[0];

    //Logger.log("Produto: " + productName + " ID: " + productID + " Id campanha: " + campaignID);
    //Logger.log("TYPEOF produtct name: " + typeof productName);

    var adData = { campaign: campaign }//objeto com a campanha  

    if (inSheet(list, productName)) {
      adData['productName'] = productName;
      deleteRowSpreadSheet(list.indexOf(productName));
      Logger.log("Produto cancelado: " + productName);
    } 

    if (adData.productName) {
      ads.push(adData)
    }
  }
  return ads
}

function notNil(xs) {
  return xs.length && xs.length !== 0;
}

function pauseCampaign(obj) {
  obj.campaign.pause();
  Utilities.sleep(2000);

  return obj;
}

function deleteRowSpreadSheet(el) {
  var ss = SpreadsheetApp.openById(LIST_SS_ID);
  var sheet = ss.getActiveSheet();

  Logger.log("Linha da planilha: " + el);

  sheet.deleteRow(el + 1);
  Utilities.sleep(1000);
  Logger.log("deletado");
}

//função que monta o corpo do email 
function composeEmail(results) {
  var currentAccount = AdsApp.currentAccount();
  var accountName = currentAccount.getName();
  var accountId = currentAccount.getCustomerId();

  var firstLine = "Conta: " + accountName + " - " + accountId + " \n " + " \n " +
    "Os seguintes produtos tiveram a Afiliação CANCELADA e a Campanha foi PAUSADA:" + " \n\n";

  var body = results.reduce(function (acc, obj) {
    var campaignName = obj.campaign.getName();
    var productName = obj.productName;

    return acc += "********************\n" + "Produto: " + productName + " \n " + "Campanha: " + campaignName + " \n " + " \n ";

  }, firstLine);

  return body;
}


