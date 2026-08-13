/**
 * ==============================================================================
 * MERVE & EMRULLAH DÜĞÜN ANILARI — GOOGLE DRIVE & SHEETS ENTEGRASYON KODU
 * ==============================================================================
 * 
 * 🛠️ KURULUM VE YENİ YAYINLAMA (DEPLOYMENT) ADIMLARI:
 * 1. script.google.com adresinde yeni bir proje oluşturun ve bu kodun tamamını yapıştırın.
 * 2. Sağ üstteki "Yayınla" (Deploy) -> "Yeni yayınlama" (New deployment) butonuna tıklayın.
 * 3. Tür seçin (Select type) -> "Web uygulaması" (Web app) seçin.
 * 4. Şu şekilde ayarlayın:
 *    - Açıklama: Merve & Emrullah Düğün Webhook (Güncellendi)
 *    - Uygulamayı şu şekilde çalıştır: "Ben" (Me)
 *    - Erişimi olanlar: "Herkes" (Anyone) — ⚠️ ÖNEMLİ: Herkes seçilmelidir!
 * 5. "Yayınla" butonuna basın ve izinleri onaylayın.
 * 6. Verilen Web App URL'ini (https://script.google.com/macros/s/.../exec) kopyalayın.
 * 7. Sitenizdeki "⚙️ Drive Bağlantısı" modaline yapıştırıp kaydedin!
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (lErr) {}

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Boş istek verisi."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var props = PropertiesService.getScriptProperties();
    var driveFileUrl = "";

    // 1. Yazılı Anı Notu Gönderildiyse ➔ Yalnızca Google Sheets Tablosuna Yaz (Drive'da Ayrı .txt Belgesi Oluşturma)
    if (data.type === "wish" || (data.message && !data.mediaUrl)) {
      try {
        var sheet;
        var sheetId = props.getProperty("sheetId");
        if (sheetId) {
          try {
            var ssCached = SpreadsheetApp.openById(sheetId);
            sheet = ssCached.getActiveSheet();
          } catch(sErr) {}
        }
        if (!sheet) {
          // Google Drive Ana Klasörünü Bul/Oluştur
          var mainFolder;
          var folderId = props.getProperty("folderId");
          if (folderId) {
            try { mainFolder = DriveApp.getFolderById(folderId); } catch(fErr) {}
          }
          if (!mainFolder) {
            var folderName = "Merve & Emrullah Düğün Anıları";
            var folders = DriveApp.getFoldersByName(folderName);
            if (folders.hasNext()) mainFolder = folders.next();
            else mainFolder = DriveApp.createFolder(folderName);
            props.setProperty("folderId", mainFolder.getId());
          }

          var sheetName = "Düğün Anı Defteri & Dilekler";
          var files = mainFolder.getFilesByName(sheetName);
          while (files.hasNext()) {
            var existingFile = files.next();
            if (!existingFile.isTrashed() && existingFile.getMimeType() === MimeType.GOOGLE_SHEETS) {
              var ss = SpreadsheetApp.openById(existingFile.getId());
              sheet = ss.getActiveSheet();
              props.setProperty("sheetId", existingFile.getId());
              break;
            }
          }
          if (!sheet) {
            var newSs = SpreadsheetApp.create(sheetName);
            var sheetFile = DriveApp.getFileById(newSs.getId());
            try {
              mainFolder.addFile(sheetFile);
              DriveApp.getRootFolder().removeFile(sheetFile);
            } catch(mErr) {}
            
            sheet = newSs.getActiveSheet();
            sheet.appendRow(["Tarih & Saat", "Ad Soyad", "Yakınlık Derecesi", "Anı Mesajı / Notu"]);
            sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#D4AF37").setFontColor("#FFFFFF");
            props.setProperty("sheetId", newSs.getId());
          }
        }

        var timeStr = Utilities.formatDate(new Date(), "GMT+3", "dd.MM.yyyy HH:mm:ss");
        sheet.appendRow([
          timeStr,
          data.name || "Anonim Davetli",
          data.side || "Ortak Arkadaş",
          data.message || ""
        ]);
        
        return ContentService.createTextOutput(JSON.stringify({
          status: "success",
          message: "Yazılı not başarıyla Google Sheets tablosuna kaydedildi!"
        })).setMimeType(ContentService.MimeType.JSON);
      } catch (sheetErr) {
        return ContentService.createTextOutput(JSON.stringify({
          status: "error",
          message: "Tablo kayıt hatası: " + sheetErr.toString()
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }

    // 2. Medya Dosyası (Fotoğraf/Video) Gönderildiyse ➔ Yalnızca Google Drive Klasörüne Kaydet (Tabloya Asla Yazma)
    if (data.mediaUrl && typeof data.mediaUrl === "string" && data.mediaUrl.startsWith("data:")) {
      try {
        var mainFolderMedia;
        var folderIdMedia = props.getProperty("folderId");
        if (folderIdMedia) {
          try { mainFolderMedia = DriveApp.getFolderById(folderIdMedia); } catch(fErr) {}
        }
        if (!mainFolderMedia) {
          var folderNameMedia = "Merve & Emrullah Düğün Anıları";
          var foldersMedia = DriveApp.getFoldersByName(folderNameMedia);
          if (foldersMedia.hasNext()) mainFolderMedia = foldersMedia.next();
          else mainFolderMedia = DriveApp.createFolder(folderNameMedia);
          props.setProperty("folderId", mainFolderMedia.getId());
        }

        var parts = data.mediaUrl.split(",");
        var contentType = parts[0].split(";")[0].replace("data:", "");
        var base64Data = parts[1];
        var decodedBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType);
        
        var ext = "jpg";
        var typePrefix = "Foto";
        
        if (contentType.indexOf("video") !== -1 || data.type === "video") {
          ext = "mp4";
          typePrefix = "Video";
          if (contentType.indexOf("quicktime") !== -1 || contentType.indexOf("mov") !== -1) ext = "mov";
          else if (contentType.indexOf("webm") !== -1) ext = "webm";
          else if (contentType.indexOf("3gp") !== -1) ext = "3gp";
          else if (contentType.indexOf("mkv") !== -1) ext = "mkv";
        } else if (contentType.indexOf("png") !== -1) ext = "png";
        else if (contentType.indexOf("webp") !== -1) ext = "webp";
        else if (contentType.indexOf("gif") !== -1) ext = "gif";

        var safeName = (data.name || "Anonim").replace(/[^a-zA-Z0-9_\-]/g, "_");
        var fileName = "Merve_Emrullah_" + safeName + "_" + typePrefix + "_" + Date.now() + "." + ext;
        decodedBlob.setName(fileName);
        
        var file = mainFolderMedia.createFile(decodedBlob);
        driveFileUrl = file.getUrl();
      } catch (mediaErr) {
        driveFileUrl = "Drive Yükleme Uyarısı: " + mediaErr.toString();
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Medya Google Drive'a kaydedildi!",
      driveFileUrl: driveFileUrl
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "Merve & Emrullah Düğün Google Drive Webhook Aktif!",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * 💡 İZİN ONAYLAMA VE TEST FONKSİYONU:
 * script.google.com sayfasında üst menüdeki açılır listeden "setupAndAuthorizePermissions"
 * fonksiyonunu seçip "Çalıştır" (Run) butonuna basın.
 * Google'ın isteyeceği Drive ve Sheets izinlerine onay verin.
 */
function setupAndAuthorizePermissions() {
  var folderName = "Merve & Emrullah Düğün Anıları";
  var folders = DriveApp.getFoldersByName(folderName);
  var mainFolder;
  if (folders.hasNext()) {
    mainFolder = folders.next();
  } else {
    mainFolder = DriveApp.createFolder(folderName);
  }

  var sheetName = "Düğün Anı Defteri & Dilekler";
  var files = mainFolder.getFilesByName(sheetName);
  var spreadsheet;
  if (files.hasNext()) {
    spreadsheet = SpreadsheetApp.open(files.next());
  } else {
    spreadsheet = SpreadsheetApp.create(sheetName);
    var sheetFile = DriveApp.getFileById(spreadsheet.getId());
    sheetFile.moveTo(mainFolder);
  }

  Logger.log("✅ İzinler başarıyla onaylandı! Klasör ID: " + mainFolder.getId());
  return "OK";
}



