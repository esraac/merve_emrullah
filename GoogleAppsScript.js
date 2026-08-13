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
    lock.waitLock(30000);
  } catch (lErr) {}

  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Boş istek verisi."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    
    // 1. Google Drive Ana Klasörünü Bul veya Oluştur
    var folderName = "Merve & Emrullah Düğün Anıları";
    var folders = DriveApp.getFoldersByName(folderName);
    var mainFolder;
    if (folders.hasNext()) {
      mainFolder = folders.next();
    } else {
      mainFolder = DriveApp.createFolder(folderName);
    }

    // 2. Google Sheets (Excel) Anı Defterini Bul veya Oluştur
    var sheetName = "Düğün Anı Defteri & Dilekler";
    var files = mainFolder.getFilesByName(sheetName);
    var spreadsheet;
    var sheet;

    while (files.hasNext()) {
      var existingFile = files.next();
      if (!existingFile.isTrashed() && existingFile.getMimeType() === MimeType.GOOGLE_SHEETS) {
        spreadsheet = SpreadsheetApp.openById(existingFile.getId());
        sheet = spreadsheet.getActiveSheet();
        break;
      }
    }

    if (!sheet) {
      spreadsheet = SpreadsheetApp.create(sheetName);
      var sheetFile = DriveApp.getFileById(spreadsheet.getId());
      sheetFile.moveTo(mainFolder);
      sheet = spreadsheet.getActiveSheet();
      // Sadeleştirilmiş Başlık Satırı Oluştur
      sheet.appendRow([
        "Tarih & Saat", 
        "Ad Soyad", 
        "Yakınlık Derecesi", 
        "Anı Türü", 
        "Anı Mesajı / Notu", 
        "Google Drive Dosya Bağlantısı"
      ]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#D4AF37").setFontColor("#FFFFFF");
    }

    var driveFileUrl = "";

    // 3. Eğer Medya Dosyası (Fotoğraf/Video) Varsa Drive'a Kaydet (İzole Hata Yönetimi)
    if (data.mediaUrl && typeof data.mediaUrl === "string" && data.mediaUrl.startsWith("data:")) {
      try {
        var parts = data.mediaUrl.split(",");
        var contentType = parts[0].split(";")[0].replace("data:", "");
        var base64Data = parts[1];
        var decodedBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType);
        
        var ext = "jpg";
        var typePrefix = "Foto";
        
        if (contentType.indexOf("video") !== -1 || data.type === "video") {
          ext = "mp4";
          typePrefix = "Video";
          if (contentType.indexOf("quicktime") !== -1 || contentType.indexOf("mov") !== -1) {
            ext = "mov";
          } else if (contentType.indexOf("webm") !== -1) {
            ext = "webm";
          } else if (contentType.indexOf("3gp") !== -1) {
            ext = "3gp";
          } else if (contentType.indexOf("mkv") !== -1) {
            ext = "mkv";
          }
        } else if (contentType.indexOf("png") !== -1) {
          ext = "png";
        } else if (contentType.indexOf("webp") !== -1) {
          ext = "webp";
        } else if (contentType.indexOf("gif") !== -1) {
          ext = "gif";
        }

        var safeName = (data.name || "Anonim").replace(/[^a-zA-Z0-9_\-]/g, "_");
        var fileName = "Merve_Emrullah_" + safeName + "_" + typePrefix + "_" + Date.now() + "." + ext;
        decodedBlob.setName(fileName);
        
        var file = mainFolder.createFile(decodedBlob);
        driveFileUrl = file.getUrl();
      } catch (mediaErr) {
        driveFileUrl = "Drive Yükleme Uyarısı: " + mediaErr.toString();
      }
    } else if (data.message) {
      // 3.2 Yazılı Notlar İçin Google Drive Klasöründe Metin Belgesi (.txt) Oluştur
      try {
        var safeNameNote = (data.name || "Anonim").replace(/[^a-zA-Z0-9_\-]/g, "_");
        var noteFileName = "Merve_Emrullah_" + safeNameNote + "_YaziliNot_" + Date.now() + ".txt";
        var noteContent = "=========================================\n" +
                          "MERVE & EMRULLAH DÜĞÜN ANI DEFTERİ NOTU\n" +
                          "=========================================\n\n" +
                          "Gönderen: " + (data.name || "Anonim Davetli") + "\n" +
                          "Yakınlık Derecesi: " + (data.side || "Ortak Arkadaş") + "\n" +
                          "Tarih & Saat: " + Utilities.formatDate(new Date(), "GMT+3", "dd.MM.yyyy HH:mm:ss") + "\n\n" +
                          "Dilek & Not:\n" + data.message + "\n\n" +
                          "-----------------------------------------";
        var txtBlob = Utilities.newBlob(noteContent, "text/plain;charset=UTF-8", noteFileName);
        var txtFile = mainFolder.createFile(txtBlob);
        try {
          txtFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (e) {}
        driveFileUrl = txtFile.getUrl();
      } catch (noteErr) {
        driveFileUrl = "Drive Not Kayıt Uyarısı: " + noteErr.toString();
      }
    }

    // 4. Yalnızca Yazılı Anı Notlarını Google Sheets Tablosuna Ekle (Fotoğraf ve Videolar yalnızca Drive klasörüne düşer)
    if (sheet && data.type === "wish") {
      try {
        var timeStr = Utilities.formatDate(new Date(), "GMT+3", "dd.MM.yyyy HH:mm:ss");
        sheet.appendRow([
          timeStr,
          data.name || "Anonim Davetli",
          data.side || "Ortak Arkadaş",
          "✍️ Yazılı Not",
          data.message || "",
          driveFileUrl || "Drive Belgesi Oluşturuldu"
        ]);
      } catch (sheetErr) {
        // Tablo yazma hatası durumunda dosya kaydını bozma
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Anı Google Drive & Sheets'e başarıyla kaydedildi!",
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



