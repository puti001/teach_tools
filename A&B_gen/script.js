document.addEventListener('DOMContentLoaded', () => {
  const inputText1 = document.getElementById('inputText1');
  const inputText2 = document.getElementById('inputText2');
  const outputText = document.getElementById('outputText');
  const processBtn = document.getElementById('processBtn');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const warningText = document.getElementById('warningText');

  const prefixTypes = {
    numbers: index => (index + 1).toString().padStart(2, '0') + '. ',
    lowerAlpha: index => String.fromCharCode(97 + (index % 26)) + '. ',
    upperAlpha: index => String.fromCharCode(65 + (index % 26)) + '. ',
    bullets: () => '• ',
    listMarks: index => ['- ', '+ ', '* '][index % 3],
    emoji: index => ['😊 ', '👍 ', '⭐ ', '💡 ', '🎯 ', '✨ '][index % 6]
  };

  function getSelectedPrefixes() {
    const selected = [];
    Object.keys(prefixTypes).forEach(type => {
      if (document.getElementById(type).checked) {
        selected.push(type);
      }
    });
    return selected;
  }

  function processText(text1, text2) {
    const lines1 = text1.split('\n').filter(line => line.trim());
    const lines2 = text2.split('\n').filter(line => line.trim());
    const selectedPrefixes = getSelectedPrefixes();
    const isPaired = document.getElementById('pairTexts').checked;
    
    let resultLines = [];
    
    if (isPaired) {
      const maxLength = Math.max(lines1.length, lines2.length);
      warningText.classList.toggle('show', lines1.length !== lines2.length);
      
      for (let i = 0; i < maxLength; i++) {
        const line1 = lines1[i] || '';
        const line2 = lines2[i] || '';
        resultLines.push(`${line1}${line2 ? ' ' + line2 : ''}`);
      }
    } else {
      resultLines = [...lines1, ...lines2];
      warningText.classList.remove('show');
    }

    if (selectedPrefixes.length === 0) {
      return resultLines.join('\n');
    }

    return resultLines.map((line, index) => {
      const prefixes = selectedPrefixes.map(type => 
        prefixTypes[type](index)
      ).join('');
      return `${prefixes}${line}`;
    }).join('\n');
  }

  processBtn.addEventListener('click', () => {
    const input1 = inputText1.value;
    const input2 = inputText2.value;
    const processed = processText(input1, input2);
    outputText.textContent = processed;
  });

  copyBtn.addEventListener('click', async () => {
    const text = outputText.textContent;
    try {
      await navigator.clipboard.writeText(text);
      alert('已複製到剪貼簿！');
    } catch (err) {
      console.error('複製失敗:', err);
      alert('複製失敗，請手動複製。');
    }
  });

  downloadBtn.addEventListener('click', () => {
    const text = outputText.textContent;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted_text.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
});