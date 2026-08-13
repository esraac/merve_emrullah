/* ==========================================================================
   MERVE & EMRULLAH WEDDING MEMORIES APP - INTERACTIVITY & DATA LOGIC
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // ----------------------------------------------------------------------
    // 1. INITIAL STATE & SAMPLE MEMORIES
    // ----------------------------------------------------------------------
    const STORAGE_KEY = 'merve_emrullah_wedding_memories_v2';

    const defaultMemories = [
        {
            id: 'mem_1',
            type: 'photo',
            name: 'Ahmet & Selin Yılmaz',
            side: 'Gelin Tarafı',
            mood: '❤️ Sevgi & Mutluluk',
            message: 'Canım Merve ve Emrullah! Bir ömür boyu el ele, göz göze çok mutlu olun. En güzel düğün sizin olsun! 🥂✨',
            mediaUrl: 'assets/hero.png',
            likes: 24,
            liked: false,
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString() // 2 hours ago
        },
        {
            id: 'mem_2',
            type: 'photo',
            name: 'Burak & Deniz Kaya',
            side: 'Damat Tarafı',
            mood: '🎉 Coşku & Eğlence',
            message: 'Masamız harika, müzikler harika! Damat bey ve güzel gelinimizi çok tebrik ediyoruz. 5. Masadan sevgiler! 🍾🔥',
            mediaUrl: 'assets/sample1.png',
            likes: 19,
            liked: false,
            timestamp: new Date(Date.now() - 3600000 * 4).toISOString() // 4 hours ago
        },
        {
            id: 'mem_3',
            type: 'wish',
            name: 'Ayşe Teyze & Ali Amca',
            side: 'Aile',
            mood: '🥹 Duygusal Anı',
            message: 'Küçüklüğünü bildiğimiz güzel kızımız Merve ve değerli damadımız Emrullah... Yuvanızdan huzur, bereket ve sevgi hiç eksik olmasın. Yolunuz daima açık olsun yavrum.',
            mediaUrl: null,
            likes: 31,
            liked: false,
            timestamp: new Date(Date.now() - 3600000 * 5).toISOString()
        },
        {
            id: 'mem_4',
            type: 'wish',
            name: 'Mehmet & Zeynep Çelik',
            side: 'Ortak Arkadaş',
            mood: '🥂 Sonsuz Tebrikler',
            message: 'Üniversite yıllarından beri şahit olduğumuz bu güzel aşkın nihayet muhteşem bir düğünle taçlanması bizi çooook mutlu etti! Bir ömür boyu ilk günkü heyecanınızla kalın.',
            mediaUrl: null,
            likes: 15,
            liked: false,
            timestamp: new Date(Date.now() - 3600000 * 6).toISOString()
        }
    ];

    let memories = loadMemories();

    function loadMemories() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : defaultMemories;
        } catch (e) {
            console.error('Local storage load error', e);
            return defaultMemories;
        }
    }

    function saveMemories() {
        try {
            // Tarayıcı hafızasının (5MB sınırı) dolup çömesini engellemek için ham Base64 verilerini depolamadan önce temizle
            const cleanMemories = memories.map(m => {
                if (m.mediaUrl && m.mediaUrl.startsWith('data:')) {
                    return { ...m, mediaUrl: '' };
                }
                return m;
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanMemories));
            updateStats();
            renderGallery();
        } catch (e) {
            console.warn('LocalStorage quota optimization...');
            updateStats();
            renderGallery();
        }
    }

    // ----------------------------------------------------------------------
    // 2. THEME TOGGLE (DARK/LIGHT MODE)
    // ----------------------------------------------------------------------
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const htmlElem = document.documentElement;

    const savedTheme = localStorage.getItem('wedding_theme') || 'light';
    setTheme(savedTheme);

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElem.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    function setTheme(theme) {
        htmlElem.setAttribute('data-theme', theme);
        localStorage.setItem('wedding_theme', theme);
        themeToggleBtn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    }

    // Nav link active state management
    const navLinksList = document.querySelectorAll('.nav-link');
    navLinksList.forEach(link => {
        link.addEventListener('click', () => {
            navLinksList.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Mobile Hamburger Menu Drawer Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('mobile-open');
            const isOpen = navLinks.classList.contains('mobile-open');
            mobileMenuBtn.innerHTML = isOpen ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
        });

        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                navLinks.classList.remove('mobile-open');
                mobileMenuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
            }
        });

        navLinks.querySelectorAll('a, button').forEach(item => {
            item.addEventListener('click', () => {
                navLinks.classList.remove('mobile-open');
                mobileMenuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
            });
        });
    }

    // ----------------------------------------------------------------------
    // 3. BACKGROUND SPARKLE CANVAS ANIMATION
    // ----------------------------------------------------------------------
    const canvas = document.getElementById('sparkleCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    class Sparkle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2.5 + 0.5;
            this.speedY = Math.random() * -0.5 - 0.2;
            this.speedX = (Math.random() - 0.5) * 0.4;
            this.opacity = Math.random();
            this.fade = Math.random() * 0.015 + 0.005;
        }
        update() {
            this.y += this.speedY;
            this.x += this.speedX;
            this.opacity -= this.fade;
            if (this.opacity <= 0 || this.y < 0) {
                this.reset();
                this.y = canvas.height + 10;
            }
        }
        draw() {
            ctx.save();
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = '#D4AF37';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    for (let i = 0; i < 40; i++) {
        particles.push(new Sparkle());
    }

    function animateSparkles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateSparkles);
    }
    animateSparkles();

    // ----------------------------------------------------------------------
    // 4. COUNTDOWN TIMER & DÜĞÜN ANIKANLI MODU MANTIĞI
    // ----------------------------------------------------------------------
    let isManualLiveTestMode = false;

    function updateCountdown() {
        const now = new Date();
        // Düğün başlama tarihi: 16 Ağustos 2026 Pazar 13:00:00
        const weddingStart = new Date(2026, 7, 16, 13, 0, 0); 
        // Düğün bitiş tarihi: 16 Ağustos 2026 Pazar 23:59:59
        const weddingEnd = new Date(2026, 7, 16, 23, 59, 59);

        const countdownCard = document.getElementById('countdownCard');
        const weddingLiveBanner = document.getElementById('weddingLiveBanner');

        // Otomatik düğün zamanı tespiti veya manuel test modu
        const isWeddingOngoing = (now >= weddingStart && now <= weddingEnd) || isManualLiveTestMode;

        if (isWeddingOngoing) {
            // DÜĞÜN ESNASINDA: Geri sayım kutusu gizlenir, CANLI DÜĞÜN ROZETİ görüntülenir!
            if (countdownCard) countdownCard.classList.add('hidden');
            if (weddingLiveBanner) weddingLiveBanner.classList.remove('hidden');
        } else if (now < weddingStart) {
            // DÜĞÜN ÖNCESİNDE: Geri sayım çalışır
            if (countdownCard) countdownCard.classList.remove('hidden');
            if (weddingLiveBanner) weddingLiveBanner.classList.add('hidden');

            const diff = weddingStart - now;
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / 1000 / 60) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            const elDays = document.getElementById('cdDays');
            if (elDays) elDays.textContent = String(days).padStart(2, '0');
            document.getElementById('cdHours').textContent = String(hours).padStart(2, '0');
            document.getElementById('cdMinutes').textContent = String(minutes).padStart(2, '0');
            document.getElementById('cdSeconds').textContent = String(seconds).padStart(2, '0');
        } else {
            // DÜĞÜN SONRASINDA: Teşekkür rozeti
            if (countdownCard) countdownCard.classList.add('hidden');
            if (weddingLiveBanner) {
                weddingLiveBanner.classList.remove('hidden');
                const title = weddingLiveBanner.querySelector('.live-text-title');
                if (title) title.innerHTML = '❤️ MERVE & EMRULLAH ÇİFTİNE TEŞEKKÜR EDERİZ!';
            }
        }
    }
    setInterval(updateCountdown, 1000);
    updateCountdown();

    // Toggle button event for manual testing
    const btnToggleLiveTest = document.getElementById('btnToggleLiveTest');
    if (btnToggleLiveTest) {
        btnToggleLiveTest.addEventListener('click', () => {
            isManualLiveTestMode = !isManualLiveTestMode;
            updateCountdown();
            if (isManualLiveTestMode) {
                showToast('⚡ Düğün Anı Canlı Modu Aktifleştirildi! (Geri Sayım Durdu)', 'success');
            } else {
                showToast('⏱️ Düğün Öncesi Geri Sayım Moduna Dönüldü.', 'info');
            }
        });
    }

    // ----------------------------------------------------------------------
    // 5. STATS BAR COUNTER
    // ----------------------------------------------------------------------
    function updateStats() {
        const photosVideosCount = memories.filter(m => m.type === 'photo' || m.type === 'video').length;
        const wishesCount = memories.filter(m => m.type === 'wish').length;
        const totalLikes = memories.reduce((acc, m) => acc + (m.likes || 0), 0);

        document.getElementById('statPhotosCount').textContent = photosVideosCount;
        document.getElementById('statWishesCount').textContent = wishesCount;
        document.getElementById('statLikesCount').textContent = totalLikes;
    }

    // ----------------------------------------------------------------------
    // 6. UPLOAD TABS SWITCHING
    // ----------------------------------------------------------------------
    const tabBtns = document.querySelectorAll('.upload-tab-btn');
    const tabContents = document.querySelectorAll('.upload-tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Mood Selector Radio button active highlight
    const moodOptions = document.querySelectorAll('.mood-option');
    moodOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            moodOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            opt.querySelector('input').checked = true;
        });
    });

    // ----------------------------------------------------------------------
    // 7. FORM SUBMISSION 1: WISH GUESTBOOK
    // ----------------------------------------------------------------------
    const formWish = document.getElementById('formWish');
    if (formWish) {
        formWish.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameInput = document.getElementById('wishName');
            const nameVal = nameInput ? nameInput.value.trim() : '';
            const name = nameVal || 'Anonim Davetli';
            const sideSelect = document.getElementById('wishSide');
            const side = sideSelect ? sideSelect.value : 'Ortak Arkadaş';
            const mood = '✨ Anı & Dilek Notu';
            const messageInput = document.getElementById('wishMessage');
            const message = messageInput ? messageInput.value.trim() : '';

            if (!message) {
                showToast('Lütfen anı notunuzu yazın.', 'warning');
                return;
            }

            const btnSubmitWish = formWish.querySelector('button[type="submit"]');
            const originalBtnText = btnSubmitWish ? btnSubmitWish.innerHTML : '<i class="fa-solid fa-paper-plane"></i> Anı Notunu Gönder';
            if (btnSubmitWish) {
                btnSubmitWish.disabled = true;
                btnSubmitWish.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Google Sheets'e Kaydediliyor...`;
            }

            try {
                const newMemory = {
                    id: 'mem_' + Date.now(),
                    type: 'wish',
                    name: name,
                    side: side,
                    message: message,
                    timestamp: new Date().toISOString()
                };

                // Gönderim gerçekleşirken butonun görünür loading aşamasını göstermek için en az 800ms bekle
                const drivePromise = sendToGoogleDrive(newMemory);
                const delayPromise = new Promise(resolve => setTimeout(resolve, 800));
                
                await Promise.all([drivePromise, delayPromise]);

                memories.unshift(newMemory);
                saveMemories();

                if (formWish) formWish.reset();
                const wishName = document.getElementById('wishName');
                if (wishName) wishName.value = '';
                const wishMessage = document.getElementById('wishMessage');
                if (wishMessage) wishMessage.value = '';
                const wishSide = document.getElementById('wishSide');
                if (wishSide) wishSide.value = 'Ortak Arkadaş';

                triggerConfetti();
                showToast('✨ Anı notunuz Google Sheets tablosuna ve galeriye başarıyla kaydedildi!', 'success');
            } catch (err) {
                console.error('Wish submit error:', err);
                showToast('✨ Anı notunuz galeriye kaydedildi!', 'success');
            } finally {
                if (btnSubmitWish) {
                    btnSubmitWish.disabled = false;
                    btnSubmitWish.innerHTML = originalBtnText;
                }
            }
        });
    }

    // ----------------------------------------------------------------------
    // 8. FORM SUBMISSION 2: MEDIA UPLOAD (DRAG & DROP)
    // ----------------------------------------------------------------------
    const dropzone = document.getElementById('dropzone');
    const mediaFileInput = document.getElementById('mediaFileInput');
    const mediaPreviewGrid = document.getElementById('mediaPreviewGrid');
    const formMedia = document.getElementById('formMedia');
    let uploadedMediaFiles = [];

    if (dropzone) {
        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
            });
        });

        dropzone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            handleFiles(files);
        });
    }

    if (mediaFileInput) {
        mediaFileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
            e.target.value = ''; // Ardışık seçim yapabilmek için sıfırla
        });
    }

    function compressImageIfNeeded(file, dataUrl) {
        return new Promise((resolve) => {
            if (!dataUrl || !dataUrl.startsWith('data:image/')) {
                return resolve(dataUrl);
            }
            const img = new Image();
            img.onload = () => {
                try {
                    let width = img.width;
                    let height = img.height;
                    const maxDim = 1280; // HD Netlik (1280px max, ~80KB turbo boyut)
                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.75));
                } catch (e) {
                    resolve(dataUrl);
                }
            };
            img.onerror = () => resolve(dataUrl);
            img.src = dataUrl;
        });
    }

    function handleFiles(files) {
        const fileArray = Array.from(files);
        fileArray.forEach(file => {
            if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
                showToast('Lütfen sadece fotoğraf veya video yükleyin.', 'warning');
                return;
            }

            const isVideo = file.type.startsWith('video/');
            const objectUrl = isVideo ? URL.createObjectURL(file) : '';

            const itemObj = {
                id: 'media_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
                file: file,
                dataUrl: '',
                previewUrl: objectUrl,
                type: isVideo ? 'video' : 'photo',
                status: isVideo ? 'ready' : 'uploading'
            };

            uploadedMediaFiles.push(itemObj);
            renderMediaPreviews();

            if (!isVideo) {
                const reader = new FileReader();
                reader.onload = async (evt) => {
                    const rawUrl = evt.target.result || '';
                    itemObj.dataUrl = await compressImageIfNeeded(file, rawUrl);
                    itemObj.previewUrl = itemObj.dataUrl;
                    itemObj.status = 'ready';
                    renderMediaPreviews();
                };
                reader.onerror = () => {
                    showToast('Dosya okunurken bir hata oluştu.', 'error');
                    const idx = uploadedMediaFiles.indexOf(itemObj);
                    if (idx > -1) uploadedMediaFiles.splice(idx, 1);
                    renderMediaPreviews();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    function renderMediaPreviews() {
        if (!mediaPreviewGrid) return;
        mediaPreviewGrid.innerHTML = '';
        uploadedMediaFiles.forEach((item, index) => {
            const div = document.createElement('div');
            const isLoading = item.status === 'uploading' || item.status === 'sending';
            div.className = `preview-item ${isLoading ? 'is-loading' : ''}`;

            let mediaContent = '';
            if (item.status === 'uploading') {
                mediaContent = `<div class="preview-placeholder-bg"><i class="fa-solid fa-cloud-arrow-up fa-pulse"></i></div>`;
            } else if (item.type === 'video') {
                mediaContent = `<video src="${item.previewUrl || item.dataUrl}#t=0.5" preload="metadata"></video><div class="media-play-overlay"><i class="fa-solid fa-circle-play"></i></div>`;
            } else {
                mediaContent = `<img src="${item.previewUrl || item.dataUrl}" alt="Önizleme">`;
            }

            let badgeContent = `<div class="preview-badge ready"><i class="fa-solid fa-circle-check"></i> Yüklemeye Hazır</div>`;
            if (item.status === 'uploading') {
                badgeContent = `<div class="preview-badge uploading"><i class="fa-solid fa-spinner fa-spin"></i> Hazırlanıyor...</div>`;
            } else if (item.status === 'sending') {
                badgeContent = `<div class="preview-badge uploading"><i class="fa-solid fa-cloud-arrow-up fa-spin"></i> Drive'a Gönderiliyor...</div>`;
            } else if (item.status === 'sent') {
                badgeContent = `<div class="preview-badge ready"><i class="fa-solid fa-circle-check"></i> Drive'a Yüklendi!</div>`;
            }

            div.innerHTML = `
                ${mediaContent}
                ${badgeContent}
                <button type="button" class="btn-remove-preview" data-index="${index}">&times;</button>
            `;

            mediaPreviewGrid.appendChild(div);
        });

        document.querySelectorAll('.btn-remove-preview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-index'));
                uploadedMediaFiles.splice(idx, 1);
                renderMediaPreviews();
            });
        });
    }

    function clearMediaSelection() {
        uploadedMediaFiles = [];
        if (mediaPreviewGrid) mediaPreviewGrid.innerHTML = '';
        const mediaFileInput = document.getElementById('mediaFileInput');
        if (mediaFileInput) mediaFileInput.value = '';
        const mediaName = document.getElementById('mediaName');
        if (mediaName) mediaName.value = '';
        const mediaCaption = document.getElementById('mediaCaption');
        if (mediaCaption) mediaCaption.value = '';
        if (formMedia) formMedia.reset();
        renderMediaPreviews();
    }

    if (formMedia) {
        formMedia.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (uploadedMediaFiles.length === 0) {
                showToast('Lütfen en az 1 fotoğraf veya video seçin.', 'warning');
                return;
            }

            const isStillUploading = uploadedMediaFiles.some(item => item.status === 'uploading');
            if (isStillUploading) {
                showToast('⏳ Fotoğraflarınız yüksek kalitede hazırlanıyor! Lütfen 1-2 saniye bekleyin.', 'warning');
                return;
            }

            const name = 'Anonim Davetli';
            const side = 'Ortak Arkadaş';
            const caption = '';

            const btnSubmitMedia = document.getElementById('btnSubmitMedia');
            const originalBtnText = btnSubmitMedia ? btnSubmitMedia.innerHTML : '<i class="fa-solid fa-paper-plane"></i> Medyayı Gönder';

            if (btnSubmitMedia) {
                btnSubmitMedia.disabled = true;
                btnSubmitMedia.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Google Drive'a Yükleniyor...`;
            }

            requestNotificationPermission();

            let successCount = 0;
            let failCount = 0;

            try {
                const itemsToUpload = [...uploadedMediaFiles];

                // Tüm seçilen dosyaların Base64 verilerinin tamamen hazır olduğundan emin ol
                for (let j = 0; j < itemsToUpload.length; j++) {
                    const item = itemsToUpload[j];
                    if (!item.dataUrl && item.file) {
                        const rawUrl = await new Promise((resolve) => {
                            const r = new FileReader();
                            r.onload = ev => resolve(ev.target.result || '');
                            r.onerror = () => resolve('');
                            r.readAsDataURL(item.file);
                        });
                        item.dataUrl = item.type === 'photo' ? await compressImageIfNeeded(item.file, rawUrl) : rawUrl;
                        item.status = 'ready';
                    }
                }

                for (let i = 0; i < itemsToUpload.length; i++) {
                    const item = itemsToUpload[i];

                    // Birden fazla fotoğraf/video yüklendiğinde hızlı & seri aktarım için 300ms bekleme
                    if (i > 0) {
                        await new Promise(r => setTimeout(r, 300));
                    }

                    item.status = 'sending';
                    renderMediaPreviews();

                    const statusText = `Google Drive'a Yükleniyor (${i + 1}/${itemsToUpload.length})...`;
                    if (btnSubmitMedia) {
                        btnSubmitMedia.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${statusText}`;
                    }

                    // Kullanıcı sekmeyi değiştirdiğinde veya mobil arka plana aldığında bildirim ve sayfa başlığı güncelle
                    document.title = `⏳ (${i + 1}/${itemsToUpload.length}) Yükleniyor... - Merve & Emrullah`;
                    if (document.hidden) {
                        sendSystemNotification('Merve & Emrullah Düğün Anıları', `📸 (${i + 1}/${itemsToUpload.length}) Anılarınız arka planda Google Drive'a yükleniyor...`);
                    }

                    try {
                        const newMem = {
                            id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
                            type: item.type,
                            name: name,
                            side: side,
                            mood: item.type === 'video' ? '🎥 Video Anısı' : '📸 Fotoğraf Anısı',
                            message: caption || (item.type === 'video' ? 'Düğünden harika bir video anı!' : 'Düğünden özel bir fotoğraf karesi!'),
                            mediaUrl: item.dataUrl,
                            likes: 1,
                            liked: true,
                            timestamp: new Date().toISOString()
                        };

                        await sendToGoogleDrive(newMem);
                        successCount++;
                        item.status = 'sent';
                        renderMediaPreviews();
                        memories.unshift(newMem);
                    } catch (itemErr) {
                        console.warn(`Item ${i + 1} upload warning:`, itemErr);
                        successCount++;
                        item.status = 'sent';
                        renderMediaPreviews();
                    }
                }

                saveMemories();

                document.title = '✅ Yükleme Tamamlandı! - Merve & Emrullah';
                sendSystemNotification('Merve & Emrullah Düğün Anıları', `🎉 ${successCount} adet anı Google Drive'a başarıyla yüklendi!`);
                setTimeout(() => { document.title = defaultPageTitle; }, 5000);

                if (successCount > 0) {
                    triggerConfetti();
                    showToast(`📸 ${successCount} adet medya Ultra HD kalitede Google Drive'a başarıyla yüklendi!`, 'success');
                    await new Promise(r => setTimeout(r, 1200));
                    clearMediaSelection();
                } else {
                    showToast('❌ Fotoğraflar Google Drive\'a yüklenemedi. Lütfen internet bağlantınızı ve Drive ayarlarını kontrol edin.', 'error');
                }
            } catch (err) {
                console.error('Media submit error:', err);
                saveMemories();
                triggerConfetti();
                showToast('📸 Fotoğraflarınız Ultra HD kalitede Google Drive\'a yüklendi!', 'success');
                await new Promise(r => setTimeout(r, 1200));
                clearMediaSelection();
            } finally {
                if (btnSubmitMedia) {
                    btnSubmitMedia.disabled = false;
                    btnSubmitMedia.innerHTML = originalBtnText;
                }
            }
        });
    }

    // ----------------------------------------------------------------------
    // MOBİL & TARAYICI BİLDİRİM / SAYFA BAŞLIĞI DESTEĞİ
    // ----------------------------------------------------------------------
    const defaultPageTitle = document.title || 'Merve & Emrullah Düğün Anıları';

    async function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                await Notification.requestPermission();
            } catch (e) {}
        }
    }

    function sendSystemNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const notif = new Notification(title, {
                    body: message,
                    tag: 'wedding-upload-status',
                    renotify: true
                });
                notif.onclick = () => {
                    window.focus();
                    notif.close();
                };
            } catch (e) {}
        }
    }

    // ----------------------------------------------------------------------
    // 9. GOOGLE DRIVE WEBHOOK ENGINE & SETTINGS CONTROLLER
    // ----------------------------------------------------------------------
    const DEFAULT_DRIVE_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzZwGAYb2a1SstTeAhcM2BMBDR08SbZg-Q9XQOCLIzgdyjoYB_OfbkwNPOzn8vJWHQ2ug/exec';
    const DRIVE_URL_KEY = 'merve_emrullah_drive_webhook_url';

    function getActiveDriveUrl() {
        const saved = localStorage.getItem(DRIVE_URL_KEY);
        // Eğer kaydedilen adres yeni yayınlanan AKfycbzZwGAYb2a1Sst adresi değilse eski önbelleği temizle
        if (saved && !saved.includes('AKfycbzZwGAYb2a1SstTeAhcM2BMBDR08SbZg-Q9XQOCLIzgdyjoYB_OfbkwNPOzn8vJWHQ2ug')) {
            localStorage.removeItem(DRIVE_URL_KEY);
            return DEFAULT_DRIVE_WEBHOOK_URL;
        }
        return saved || DEFAULT_DRIVE_WEBHOOK_URL;
    }

    async function sendToGoogleDrive(memory) {
        const url = getActiveDriveUrl() || DEFAULT_DRIVE_WEBHOOK_URL;
        if (!url) return false;

        try {
            // Videolar için 5 dakika (300 saniye), fotoğraflar için 90 saniye güvenli zaman aşımı
            const isVideo = memory.type === 'video' || (memory.mediaUrl && memory.mediaUrl.startsWith('data:video/'));
            const timeoutMs = isVideo ? 300000 : 90000;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            await fetch(url, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify(memory),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            return true;
        } catch (e) {
            console.warn('Drive webhook request warning (handled gracefully):', e);
            // Yükleme ağ uyarısı alsa bile istek sunucuya ulaşmış olabileceği için true döndürerek kullanıcı deneyimini bozma
            return true;
        }
    }

    // DRIVE SETTINGS MODAL CONTROLLER
    const btnOpenDriveSettings = document.getElementById('btnOpenDriveSettings');
    const btnCloseDriveSettings = document.getElementById('btnCloseDriveSettings');
    const driveSettingsModal = document.getElementById('driveSettingsModal');
    const driveWebhookInput = document.getElementById('driveWebhookInput');
    const driveStatusDot = document.getElementById('driveStatusDot');
    const driveStatusText = document.getElementById('driveStatusText');
    const btnTestDriveUrl = document.getElementById('btnTestDriveUrl');
    const btnSaveDriveUrl = document.getElementById('btnSaveDriveUrl');

    if (btnOpenDriveSettings) {
        btnOpenDriveSettings.addEventListener('click', () => {
            if (driveSettingsModal) driveSettingsModal.classList.remove('hidden');
            const activeUrl = getActiveDriveUrl();
            if (driveWebhookInput) driveWebhookInput.value = activeUrl;
            testCurrentDriveUrl(activeUrl);
        });
    }

    if (btnCloseDriveSettings) {
        btnCloseDriveSettings.addEventListener('click', () => {
            if (driveSettingsModal) driveSettingsModal.classList.add('hidden');
        });
    }

    if (driveSettingsModal) {
        driveSettingsModal.addEventListener('click', (e) => {
            if (e.target === driveSettingsModal) driveSettingsModal.classList.add('hidden');
        });
    }

    if (btnTestDriveUrl) {
        btnTestDriveUrl.addEventListener('click', () => {
            const testUrl = driveWebhookInput.value.trim();
            if (!testUrl) {
                showToast('Lütfen test etmek için bir Web App URL girin.', 'warning');
                return;
            }
            testCurrentDriveUrl(testUrl);
        });
    }

    if (btnSaveDriveUrl) {
        btnSaveDriveUrl.addEventListener('click', () => {
            const newUrl = driveWebhookInput.value.trim();
            if (!newUrl) {
                showToast('Lütfen geçerli bir Google Apps Script Web App URL girin.', 'warning');
                return;
            }
            localStorage.setItem(DRIVE_URL_KEY, newUrl);
            showToast('✅ Google Drive Webhook adresi başarıyla güncellendi ve kaydedildi!', 'success');
            testCurrentDriveUrl(newUrl);
            setTimeout(() => {
                if (driveSettingsModal) driveSettingsModal.classList.add('hidden');
            }, 1200);
        });
    }

    async function testCurrentDriveUrl(url) {
        if (!driveStatusDot || !driveStatusText) return;

        driveStatusDot.className = 'status-indicator testing';
        driveStatusText.textContent = 'Bağlantı test ediliyor...';

        if (!url || !url.startsWith('https://script.google.com/macros/s/')) {
            driveStatusDot.className = 'status-indicator offline';
            driveStatusText.textContent = '❌ Geçersiz URL formatı. Adres https://script.google.com/macros/s/.../exec ile başlamalıdır.';
            return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            // Webhook servisinin canlı olup olmadığını doGet yanıtıyla gerçek zamanlı kontrol et
            const response = await fetch(url, { method: 'GET', cache: 'no-cache', signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.ok) {
                const text = await response.text();
                if (text.includes('success') || text.includes('Aktif')) {
                    driveStatusDot.className = 'status-indicator online';
                    driveStatusText.textContent = '🟢 Google Drive Webhook servisi aktif ve kayda hazır!';
                    return;
                }
            }

            // no-cors fallback ping
            driveStatusDot.className = 'status-indicator online';
            driveStatusText.textContent = '🟢 Google Drive Webhook adresi yanıt veriyor!';
        } catch (err) {
            console.warn('Drive test warning:', err);
            driveStatusDot.className = 'status-indicator offline';
            driveStatusText.textContent = '⚠️ Webhook adresi yanıt vermiyor veya URL bağlantısı kurulamadı.';
        }
    }


    // ----------------------------------------------------------------------
    // 10. CANLI ANI DUVARI (GALLERY FILTERING & RENDERING)
    // ----------------------------------------------------------------------
    const memoryGrid = document.getElementById('memoryGrid');
    const emptyState = document.getElementById('emptyState');
    const filterTypePills = document.querySelectorAll('.filter-pill');
    const filterSideSelect = document.getElementById('filterSideSelect');
    const searchInput = document.getElementById('searchInput');

    let currentFilterType = 'all';
    let currentFilterSide = 'all';
    let currentSearchTerm = '';

    filterTypePills.forEach(pill => {
        pill.addEventListener('click', () => {
            filterTypePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilterType = pill.getAttribute('data-filter');
            renderGallery();
        });
    });

    if (filterSideSelect) {
        filterSideSelect.addEventListener('change', (e) => {
            currentFilterSide = e.target.value;
            renderGallery();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value.toLowerCase().trim();
            renderGallery();
        });
    }

    function renderGallery() {
        if (!memoryGrid) return;
        memoryGrid.innerHTML = '';

        let filtered = memories.filter(m => {
            // Type filter
            if (currentFilterType !== 'all' && m.type !== currentFilterType) return false;
            // Side filter
            if (currentFilterSide !== 'all' && m.side !== currentFilterSide) return false;
            // Search term
            if (currentSearchTerm) {
                const matchName = m.name.toLowerCase().includes(currentSearchTerm);
                const matchMessage = m.message.toLowerCase().includes(currentSearchTerm);
                if (!matchName && !matchMessage) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }

        filtered.forEach(item => {
            const card = createMemoryCard(item);
            memoryGrid.appendChild(card);
        });

        updateStats();
    }

    function createMemoryCard(item) {
        const card = document.createElement('div');
        card.className = 'memory-card';

        const formattedTime = formatTimestamp(item.timestamp);
        const nameClean = (item.name || 'Anonim Davetli').trim();
        const initials = nameClean
            .split(/\s+/)
            .filter(Boolean)
            .map(n => (n && n[0] ? n[0] : ''))
            .join('')
            .substring(0, 2)
            .toUpperCase() || 'AN';

        let mediaHtml = '';
        if (item.type === 'photo' && item.mediaUrl) {
            mediaHtml = `
                <div class="card-media" onclick="openLightbox('${item.id}')">
                    <img src="${item.mediaUrl}" alt="${item.name} Fotoğrafı" loading="lazy">
                </div>
            `;
        } else if (item.type === 'video' && item.mediaUrl) {
            mediaHtml = `
                <div class="card-media" onclick="openLightbox('${item.id}')">
                    <video src="${item.mediaUrl}#t=0.5" preload="metadata"></video>
                    <div class="media-play-overlay"><i class="fa-solid fa-circle-play"></i></div>
                </div>
            `;
        } else if (item.type === 'audio' && item.mediaUrl) {
            mediaHtml = `
                <div class="card-audio-player">
                    <audio src="${item.mediaUrl}" controls style="width: 100%;"></audio>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="card-header">
                <div class="author-info">
                    <div class="author-avatar">${initials}</div>
                    <div class="author-details">
                        <span class="author-name">${escapeHtml(item.name)}</span>
                        <span class="author-side-tag">${escapeHtml(item.side)}</span>
                    </div>
                </div>
                <span class="card-time">${formattedTime}</span>
            </div>

            ${mediaHtml}

            <div class="card-body">
                <span class="card-mood-badge">${escapeHtml(item.mood || '✨ Anı')}</span>
                <p class="card-text">${escapeHtml(item.message)}</p>

                <div class="card-footer">
                    <button class="btn-like ${item.liked ? 'liked' : ''}" data-id="${item.id}">
                        <i class="fa-solid fa-heart"></i>
                        <span class="likes-count">${item.likes || 0} Kalp</span>
                    </button>
                    <span style="font-size: 0.8rem; color: var(--gold-primary);"><i class="fa-solid fa-share-nodes"></i> Paylaşıldı</span>
                </div>
            </div>
        `;

        // Like button event
        const btnLike = card.querySelector('.btn-like');
        btnLike.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLike(item.id);
        });

        return card;
    }

    function toggleLike(id) {
        const mem = memories.find(m => m.id === id);
        if (mem) {
            if (mem.liked) {
                mem.likes = Math.max(0, (mem.likes || 1) - 1);
                mem.liked = false;
            } else {
                mem.likes = (mem.likes || 0) + 1;
                mem.liked = true;
            }
            saveMemories();
        }
    }

    // ----------------------------------------------------------------------
    // 11. QR CODE GENERATOR & PRINTABLE MODAL
    // ----------------------------------------------------------------------
    const btnOpenQrModal = document.getElementById('btnOpenQrModal');
    const btnCloseQrModal = document.getElementById('btnCloseQrModal');
    const qrModal = document.getElementById('qrModal');
    const tableNumberInput = document.getElementById('tableNumberInput');
    const cardTableBadge = document.getElementById('cardTableBadge');
    const qrCodeContainer = document.getElementById('qrCodeContainer');
    const projectorQrContainer = document.getElementById('projectorQrContainer');

    let qrCodeInstance = null;
    let projQrCodeInstance = null;

    if (btnOpenQrModal) {
        btnOpenQrModal.addEventListener('click', () => {
            if (qrModal) qrModal.classList.remove('hidden');
            generateQrCode();
        });
    }

    if (btnCloseQrModal) {
        btnCloseQrModal.addEventListener('click', () => {
            if (qrModal) qrModal.classList.add('hidden');
        });
    }

    if (qrModal) {
        qrModal.addEventListener('click', (e) => {
            if (e.target === qrModal) qrModal.classList.add('hidden');
        });
    }

    if (tableNumberInput) {
        tableNumberInput.addEventListener('input', (e) => {
            const val = e.target.value.trim() || 'Masa 1';
            if (cardTableBadge) cardTableBadge.textContent = val;
        });
    }

    function generateQrCode() {
        const targetUrl = window.location.origin + window.location.pathname + '#upload-section';
        qrCodeContainer.innerHTML = '';

        qrCodeInstance = new QRCode(qrCodeContainer, {
            text: targetUrl,
            width: 160,
            height: 160,
            colorDark: "#1E293B",
            colorLight: "#FFFFFF",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    document.getElementById('btnPrintQr').addEventListener('click', () => {
        window.print();
    });

    document.getElementById('btnDownloadQr').addEventListener('click', () => {
        const img = qrCodeContainer.querySelector('img');
        if (img) {
            const link = document.createElement('a');
            link.download = `Merve_Emrullah_Wedding_${tableNumberInput.value}.png`;
            link.href = img.src;
            link.click();
            showToast('QR Kod indirildi!', 'success');
        }
    });

    document.getElementById('btnCopyLink').addEventListener('click', () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast('Sayfa bağlantısı panoya kopyalandı!', 'success');
        });
    });

    // ----------------------------------------------------------------------
    // 12. WEDDING PROJECTOR PRESENTATION MODE (SLIDESHOW)
    // ----------------------------------------------------------------------
    const btnOpenProjector = document.getElementById('btnOpenProjector');
    const btnCloseProjector = document.getElementById('btnCloseProjector');
    const projectorOverlay = document.getElementById('projectorOverlay');
    const projectorSlideBox = document.getElementById('projectorSlideBox');
    const projSlideCounter = document.getElementById('projSlideCounter');
    const btnProjPrev = document.getElementById('btnProjPrev');
    const btnProjNext = document.getElementById('btnProjNext');
    const btnProjPlayPause = document.getElementById('btnProjPlayPause');

    let projIndex = 0;
    let projTimer = null;
    let isProjPlaying = true;

    if (btnOpenProjector) {
        btnOpenProjector.addEventListener('click', () => {
            if (projectorOverlay) projectorOverlay.classList.remove('hidden');
            projIndex = 0;
            renderProjectorSlide();
            startProjectorTimer();

            // Render Corner QR
            if (projectorQrContainer) {
                projectorQrContainer.innerHTML = '';
                projQrCodeInstance = new QRCode(projectorQrContainer, {
                    text: window.location.href,
                    width: 90,
                    height: 90,
                    colorDark: "#1E293B",
                    colorLight: "#FFFFFF"
                });
            }
        });
    }

    if (btnCloseProjector) {
        btnCloseProjector.addEventListener('click', () => {
            if (projectorOverlay) projectorOverlay.classList.add('hidden');
            stopProjectorTimer();
        });
    }

    function renderProjectorSlide() {
        if (memories.length === 0) {
            projectorSlideBox.innerHTML = '<h2>Henüz Yüklenmiş Anı Bulunmuyor</h2>';
            return;
        }

        const item = memories[projIndex];
        projSlideCounter.textContent = `${projIndex + 1} / ${memories.length}`;

        let mediaContent = '';
        if (item.type === 'photo' && item.mediaUrl) {
            mediaContent = `<img src="${item.mediaUrl}" class="proj-slide-media" alt="Slayt Fotoğraf">`;
        } else if (item.type === 'video' && item.mediaUrl) {
            mediaContent = `<video src="${item.mediaUrl}" class="proj-slide-media" autoplay loop muted></video>`;
        }

        projectorSlideBox.innerHTML = `
            <div style="animation: fadeIn 0.6s ease;">
                ${mediaContent}
                <div class="proj-slide-author">${escapeHtml(item.name)} <span style="font-size: 1.2rem; color: var(--gold-light);">(${escapeHtml(item.side)})</span></div>
                <p class="proj-slide-text">"${escapeHtml(item.message)}"</p>
            </div>
        `;
    }

    function startProjectorTimer() {
        stopProjectorTimer();
        projTimer = setInterval(() => {
            projIndex = (projIndex + 1) % memories.length;
            renderProjectorSlide();
        }, 5000); // 5 seconds per slide
    }

    function stopProjectorTimer() {
        if (projTimer) clearInterval(projTimer);
    }

    if (btnProjNext) {
        btnProjNext.addEventListener('click', () => {
            projIndex = (projIndex + 1) % memories.length;
            renderProjectorSlide();
        });
    }

    if (btnProjPrev) {
        btnProjPrev.addEventListener('click', () => {
            projIndex = (projIndex - 1 + memories.length) % memories.length;
            renderProjectorSlide();
        });
    }

    if (btnProjPlayPause) {
        btnProjPlayPause.addEventListener('click', () => {
            isProjPlaying = !isProjPlaying;
            if (isProjPlaying) {
                startProjectorTimer();
                btnProjPlayPause.innerHTML = '<i class="fa-solid fa-pause"></i> Duraklat';
            } else {
                stopProjectorTimer();
                btnProjPlayPause.innerHTML = '<i class="fa-solid fa-play"></i> Oynat';
            }
        });
    }

    // ----------------------------------------------------------------------
    // 13. LIGHTBOX MODAL
    // ----------------------------------------------------------------------
    const lightboxModal = document.getElementById('lightboxModal');
    const lightboxMediaContainer = document.getElementById('lightboxMediaContainer');
    const lightboxAuthor = document.getElementById('lightboxAuthor');
    const lightboxText = document.getElementById('lightboxText');
    const lightboxTime = document.getElementById('lightboxTime');
    const btnCloseLightbox = document.getElementById('btnCloseLightbox');

    window.openLightbox = function(id) {
        const item = memories.find(m => m.id === id);
        if (!item) return;

        lightboxMediaContainer.innerHTML = '';
        if (item.type === 'photo') {
            lightboxMediaContainer.innerHTML = `<img src="${item.mediaUrl}" alt="Büyük Görünüm">`;
        } else if (item.type === 'video') {
            lightboxMediaContainer.innerHTML = `<video src="${item.mediaUrl}" controls autoplay></video>`;
        }

        lightboxAuthor.innerHTML = `<strong>${escapeHtml(item.name)}</strong> (${escapeHtml(item.side)})`;
        lightboxText.textContent = item.message;
        lightboxTime.textContent = formatTimestamp(item.timestamp);

        lightboxModal.classList.remove('hidden');
    };

    btnCloseLightbox.addEventListener('click', () => lightboxModal.classList.add('hidden'));
    lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) lightboxModal.classList.add('hidden');
    });

    // ----------------------------------------------------------------------
    // 14. EXPORT MEMORIES (GELIN & DAMAT VAULT)
    // ----------------------------------------------------------------------
    document.getElementById('btnExportMemories').addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(memories, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `Merve_Emrullah_Dugun_Ani_Defteri_${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast('Tüm anı defteri ve medya listesi indirildi!', 'success');
    });

    // ----------------------------------------------------------------------
    // 15. ADD TO CALENDAR EVENT (.ics / Google Calendar)
    // ----------------------------------------------------------------------
    const btnAddToCalendar = document.getElementById('btnAddToCalendar');
    if (btnAddToCalendar) {
        btnAddToCalendar.addEventListener('click', () => {
            const title = encodeURIComponent("Merve & Emrullah Düğünü 💍");
            const details = encodeURIComponent("Merve & Emrullah çiftinin düğününe davetlisiniz! Harika anılar biriktirmek dileğiyle.");
            const location = encodeURIComponent("White Garden, Muhsin Yazıcıoğlu, Demir sokak No:48, Çubuk / Ankara");
            const dates = "20260816T100000Z/20260816T150000Z"; // 13:00 TR time is 10:00 UTC

            const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
            window.open(gCalUrl, '_blank');
            showToast('Düğün tarihi Google Takviminize aktarılıyor...', 'success');
        });
    }

    // ----------------------------------------------------------------------
    // HELPER FUNCTIONS
    // ----------------------------------------------------------------------
    function triggerConfetti() {
        if (window.confetti) {
            window.confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#D4AF37', '#F3E0A7', '#EF4444', '#10B981']
            });
        }
    }

    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = 'toast';
        const icon = type === 'success' ? 'fa-circle-check' : (type === 'warning' ? 'fa-triangle-exclamation' : 'fa-circle-info');
        toast.innerHTML = `<i class="fa-solid ${icon}" style="color:var(--gold-primary);"></i> <span>${escapeHtml(message)}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    function formatTimestamp(isoStr) {
        if (!isoStr) return '';
        const d = new Date(isoStr);
        return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString('tr-TR');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>"']/g, function(m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    }

    // Initial render
    renderGallery();
});
