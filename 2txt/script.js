function downloadText() {
  const content = document.getElementById('content').value;
  
  // 如果內容為空，顯示警告
  if (!content.trim()) {
    alert('請輸入內容！');
    return;
  }
  
  // 取得第一行作為檔名
  const lines = content.split('\n');
  const filename = lines[0].trim() || 'untitled';
  
  // 建立Blob物件
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  
  // 建立下載連結
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}.txt`;
  
  // 觸發下載
  document.body.appendChild(a);
  a.click();
  
  // 清理
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}