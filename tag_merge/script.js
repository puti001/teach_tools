import html2canvas from 'html2canvas';

let excelData = [];
let selectedColumns = new Set();

// 初始化事件監聽
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('fileInput').addEventListener('change', handleFileSelect);
    document.getElementById('generatePDF').addEventListener('click', generatePDF);
    
    // 監聽所有會觸發預覽更新的輸入元素
    const updateTriggers = [
        'labelsPerRow', 'labelsPerCol', 'fontSize', 'fontFamily',
        'pageMargin', 'labelPadding', 'showFieldNames'
    ];
    
    updateTriggers.forEach(id => {
        document.getElementById(id).addEventListener('change', updatePreview);
    });
});

// 處理 Excel 檔案上傳
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        excelData = XLSX.utils.sheet_to_json(firstSheet);
        
        if (excelData.length > 0) {
            updateColumnSelection(Object.keys(excelData[0]));
            updatePreview();
        }
    };
    reader.readAsArrayBuffer(file);
}

// 更新欄位選擇區
function updateColumnSelection(columns) {
    const container = document.getElementById('columnSelection');
    container.innerHTML = '';
    
    columns.forEach((col, index) => {
        if (index < 7) { // 限制 A-G 欄
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = col;
            checkbox.checked = true;
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    selectedColumns.add(col);
                } else {
                    selectedColumns.delete(col);
                }
                updatePreview();
            });
            
            selectedColumns.add(col);
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(col));
            container.appendChild(label);
        }
    });
}

// 更新預覽
function updatePreview() {
    const container = document.getElementById('previewContainer');
    container.innerHTML = '';
    
    if (!excelData.length) return;

    const labelsPerRow = parseInt(document.getElementById('labelsPerRow').value);
    const labelsPerCol = parseInt(document.getElementById('labelsPerCol').value);
    const fontSize = parseInt(document.getElementById('fontSize').value);
    const fontFamily = document.getElementById('fontFamily').value;
    const pageMargin = parseInt(document.getElementById('pageMargin').value);
    const labelPadding = parseInt(document.getElementById('labelPadding').value);
    const showFieldNames = document.getElementById('showFieldNames').checked;

    // 計算總頁數
    const labelsPerPage = labelsPerRow * labelsPerCol;
    const totalPages = Math.ceil(excelData.length / labelsPerPage);

    // 只顯示第一頁預覽
    const availableWidth = 210 - (pageMargin * 2);
    const availableHeight = 297 - (pageMargin * 2);
    const labelWidth = availableWidth / labelsPerRow;
    const labelHeight = availableHeight / labelsPerCol;

    // 生成第一頁的標籤預覽
    for (let i = 0; i < Math.min(labelsPerPage, excelData.length); i++) {
        const rowPosition = Math.floor(i / labelsPerRow);
        const colPosition = i % labelsPerRow;
        const row = excelData[i];
        
        const label = document.createElement('div');
        label.className = 'preview-label';
        label.style.width = `${labelWidth}mm`;
        label.style.height = `${labelHeight}mm`;
        label.style.left = `${pageMargin + (colPosition * labelWidth)}mm`;
        label.style.top = `${pageMargin + (rowPosition * labelHeight)}mm`;
        
        const content = document.createElement('div');
        content.className = 'preview-content';
        content.style.padding = `${labelPadding}mm`;
        content.style.fontSize = `${fontSize}px`;
        content.style.fontFamily = fontFamily;
        
        Array.from(selectedColumns).forEach(col => {
            if (showFieldNames) {
                const fieldName = document.createElement('div');
                fieldName.className = 'field-name';
                fieldName.textContent = col;
                content.appendChild(fieldName);
            }
            
            const value = document.createElement('div');
            value.textContent = row[col] || '';
            content.appendChild(value);
        });
        
        label.appendChild(content);
        container.appendChild(label);
    }

    // 顯示總頁數提示
    if (totalPages > 1) {
        const pageInfo = document.createElement('div');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `預覽第 1 頁 (共 ${totalPages} 頁)`;
        container.appendChild(pageInfo);
    }
}

// 產生 PDF
async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const container = document.getElementById('previewContainer');
    
    const labelsPerRow = parseInt(document.getElementById('labelsPerRow').value);
    const labelsPerCol = parseInt(document.getElementById('labelsPerCol').value);
    const labelsPerPage = labelsPerRow * labelsPerCol;
    const totalPages = Math.ceil(excelData.length / labelsPerPage);

    try {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        for (let page = 0; page < totalPages; page++) {
            // 清除之前的預覽內容
            container.innerHTML = '';
            
            // 生成當前頁的標籤
            const startIdx = page * labelsPerPage;
            const endIdx = Math.min((page + 1) * labelsPerPage, excelData.length);
            
            for (let i = startIdx; i < endIdx; i++) {
                // 重用現有的標籤生成邏輯
                const rowPosition = Math.floor((i - startIdx) / labelsPerRow);
                const colPosition = (i - startIdx) % labelsPerRow;
                const row = excelData[i];
                
                const label = document.createElement('div');
                label.className = 'preview-label';
                const availableWidth = 210 - (parseInt(document.getElementById('pageMargin').value) * 2);
                const availableHeight = 297 - (parseInt(document.getElementById('pageMargin').value) * 2);
                const labelWidth = availableWidth / labelsPerRow;
                const labelHeight = availableHeight / labelsPerCol;
                const pageMargin = parseInt(document.getElementById('pageMargin').value);
                
                label.style.width = `${labelWidth}mm`;
                label.style.height = `${labelHeight}mm`;
                label.style.left = `${pageMargin + (colPosition * labelWidth)}mm`;
                label.style.top = `${pageMargin + (rowPosition * labelHeight)}mm`;
                
                const content = document.createElement('div');
                content.className = 'preview-content';
                content.style.padding = `${document.getElementById('labelPadding').value}mm`;
                content.style.fontSize = `${document.getElementById('fontSize').value}px`;
                content.style.fontFamily = document.getElementById('fontFamily').value;
                
                Array.from(selectedColumns).forEach(col => {
                    if (document.getElementById('showFieldNames').checked) {
                        const fieldName = document.createElement('div');
                        fieldName.className = 'field-name';
                        fieldName.textContent = col;
                        content.appendChild(fieldName);
                    }
                    
                    const value = document.createElement('div');
                    value.textContent = row[col] || '';
                    content.appendChild(value);
                });
                
                label.appendChild(content);
                container.appendChild(label);
            }

            // 將當前頁轉換為圖片並添加到PDF
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            if (page > 0) {
                pdf.addPage();
            }
            
            pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
        }
        
        pdf.save('labels.pdf');
        
        // 恢復第一頁預覽
        updatePreview();
    } catch (error) {
        console.error('PDF generation failed:', error);
        alert('PDF 產生失敗，請稍後再試。');
    }
}