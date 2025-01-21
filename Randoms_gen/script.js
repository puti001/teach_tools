document.getElementById('generate').addEventListener('click', generateRandomNumbers);

function generateRandomNumbers() {
  const min = parseInt(document.getElementById('min').value);
  const max = parseInt(document.getElementById('max').value);
  const cols = parseInt(document.getElementById('cols').value);
  const rows = parseInt(document.getElementById('rows').value);

  // 驗證輸入
  if (isNaN(min) || isNaN(max) || isNaN(cols) || isNaN(rows)) {
    alert('請填寫所有欄位！');
    return;
  }

  if (min >= max) {
    alert('最小值必須小於最大值！');
    return;
  }

  if (cols <= 0 || rows <= 0) {
    alert('直欄和橫列必須大於0！');
    return;
  }

  // 產生亂數表格
  const table = document.createElement('table');
  let numbersText = ''; // 用於存儲要複製的文字
  
  for (let i = 0; i < rows; i++) {
    const tr = document.createElement('tr');
    const rowNumbers = [];
    
    for (let j = 0; j < cols; j++) {
      const number = getRandomNumber(min, max);
      const td = document.createElement('td');
      td.textContent = number;
      tr.appendChild(td);
      rowNumbers.push(number);
    }
    
    table.appendChild(tr);
    numbersText += rowNumbers.join('\t') + '\n';
  }

  // 清空並顯示結果
  const result = document.getElementById('result');
  result.innerHTML = '';
  result.appendChild(table);

  // 複製到剪貼簿
  navigator.clipboard.writeText(numbersText.trim())
    .then(() => {
      const button = document.getElementById('generate');
      const originalText = button.textContent;
      button.textContent = '複製成功！';
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    })
    .catch(err => {
      console.error('複製失敗:', err);
      alert('複製失敗，請手動複製。');
    });
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}