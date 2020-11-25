/****************************************************************************
 *
 *  Sweet Leads Empreendimentos Digitais
 *  https://sweetleads.com.br
 *  felipe@sweetleads.com.br
 * 
 *  SCRIPT DE AFILIAÇÃO CANCELADA
 * 
 *  Script que checa o email verificando se no marcador (AfiliacaoCancelada) 
 *  contém mensagem não lida. Caso positivo, o nome do produto será inserido na planilha
 *  e a mensagem marcada como lida.
 * 
 ****************************************************************************/

LABEL_EMAIL = 'AfiliacaoCancelada';

SPREADSHEET_ID = '1F7L4DdGDkcUg72BPN-f3JHDeAJ_ft7seDnsI6NYgf2s';

function main() {

    var results = getMensagens().map(saveSpreadSheet);
    Logger.log("*************results****************");
    Logger.log(JSON.stringify(results))
    Logger.log("*************results****************");
}

function getMensagens() {

    Logger.log("coletando mensagens...");

    var label = GmailApp.getUserLabelByName(LABEL_EMAIL);
    var threads = label.getThreads();

    var messages = [];

    threads.forEach(function (thread) {
        if (thread.getMessages()[0].isUnread()) {
            messages.push(thread.getMessages()[0].getSubject());
            thread.markRead();
        }
    });

    return messages;

}

function saveSpreadSheet(obj) {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getActiveSheet(); 

    var product = obj.match(/(?!.*:)+(?!.*\s)+(.*)/g)

    sheet.appendRow(product);
}
