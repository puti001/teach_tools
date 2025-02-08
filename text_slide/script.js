document.addEventListener('DOMContentLoaded', () => {
  const editorView = document.getElementById('editor-view');
  const presentationView = document.getElementById('presentation-view');
  const slidesText = document.getElementById('slides-text');
  const slideContent = document.getElementById('slide-content');
  const startButton = document.getElementById('start-presentation');
  const endButton = document.getElementById('end-presentation');
  const prevButton = document.getElementById('prev-slide');
  const nextButton = document.getElementById('next-slide');
  const slideSelector = document.getElementById('slide-selector');
  const exportBtn = document.getElementById('export-btn');
  const importBtn = document.getElementById('import-btn');
  const importFile = document.getElementById('import-file');

  let currentSlides = [];
  let currentSlideIndex = 0;

  // Load saved content from localStorage
  const savedContent = localStorage.getItem('slides-content');
  if (savedContent) {
    slidesText.value = savedContent;
  }

  // Save content to localStorage whenever it changes
  slidesText.addEventListener('input', () => {
    localStorage.setItem('slides-content', slidesText.value);
  });

  // Export functionality
  exportBtn.addEventListener('click', () => {
    const content = slidesText.value;
    const data = {
      content,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `presentation-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // Modified alert messages to use translations
  function showAlert(key) {
    alert(i18n.t(key));
  }

  // Import functionality
  importBtn.addEventListener('click', () => {
    importFile.click();
  });

  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          slidesText.value = data.content;
          localStorage.setItem('slides-content', data.content);
          showAlert('importSuccess');
        } catch (error) {
          showAlert('importError');
        }
      };
      reader.readAsText(file);
    }
  });

  function parseSlides(text) {
    return text.trim().split(/\n\s*\n/).map(slide => {
      const lines = slide.trim().split('\n');
      return {
        title: lines[0],
        content: lines.slice(1).join('\n')
      };
    });
  }

  function displaySlide(slideIndex) {
    if (slideIndex >= 0 && slideIndex < currentSlides.length) {
      const slide = currentSlides[slideIndex];
      slideContent.innerHTML = `
        <h2>${slide.title}</h2>
        <p>${slide.content}</p>
      `;
      
      // Update select element
      slideSelector.value = slideIndex;

      // Adjust font size based on container size
      adjustFontSize();
    }
  }

  function adjustFontSize() {
    const container = slideContent.parentElement;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;
    
    const title = slideContent.querySelector('h2');
    const content = slideContent.querySelector('p');
    
    if (title && content) {
      // Reset font sizes to calculate proper scaling
      title.style.fontSize = '';
      content.style.fontSize = '';
      
      const baseTitleSize = parseInt(window.getComputedStyle(title).fontSize);
      const baseContentSize = parseInt(window.getComputedStyle(content).fontSize);
      
      // Calculate scale factor based on container size
      const scaleFactor = Math.min(
        containerWidth / 800,  // Adjust base width as needed
        containerHeight / 450  // Adjust base height as needed
      );
      
      title.style.fontSize = `${baseTitleSize * scaleFactor}px`;
      content.style.fontSize = `${baseContentSize * scaleFactor}px`;
    }
  }

  function populateSlideSelector() {
    slideSelector.innerHTML = '';
    currentSlides.forEach((slide, idx) => {
      const option = document.createElement('option');
      option.value = idx;
      option.textContent = `${idx + 1}. ${slide.title}`;
      slideSelector.appendChild(option);
    });
  }

  function startPresentation() {
    const text = slidesText.value.trim();
    if (!text) {
      showAlert('noContent');
      return;
    }

    currentSlides = parseSlides(text);
    if (currentSlides.length === 0) {
      showAlert('noValidContent');
      return;
    }

    currentSlideIndex = 0;
    editorView.classList.add('hidden');
    presentationView.classList.remove('hidden');
    
    populateSlideSelector();
    displaySlide(currentSlideIndex);
  }

  function endPresentation() {
    editorView.classList.remove('hidden');
    presentationView.classList.add('hidden');
  }

  function nextSlide() {
    if (currentSlideIndex < currentSlides.length - 1) {
      currentSlideIndex++;
      displaySlide(currentSlideIndex);
    }
  }

  function prevSlide() {
    if (currentSlideIndex > 0) {
      currentSlideIndex--;
      displaySlide(currentSlideIndex);
    }
  }

  // Add tab functionality
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.dataset.tab;
      
      // Update active states
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Activate selected tab
      button.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');
    });
  });

  // Event Listeners
  startButton.addEventListener('click', startPresentation);
  endButton.addEventListener('click', endPresentation);
  prevButton.addEventListener('click', prevSlide);
  nextButton.addEventListener('click', nextSlide);
  
  slideSelector.addEventListener('change', (e) => {
    currentSlideIndex = parseInt(e.target.value);
    displaySlide(currentSlideIndex);
  });

  // Keyboard controls
  document.addEventListener('keydown', (e) => {
    if (presentationView.classList.contains('hidden')) return;

    switch(e.key) {
      case 'ArrowRight':
      case 'Space':
      case 'Enter':
        nextSlide();
        break;
      case 'ArrowLeft':
      case 'Backspace':
        prevSlide();
        break;
      case 'Escape':
        endPresentation();
        break;
    }
  });

  // Touch events
  let touchStartX = 0;
  presentationView.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  });

  presentationView.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchEndX - touchStartX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
  });
});