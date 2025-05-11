document.addEventListener('DOMContentLoaded', () => {
    const studentList = document.getElementById('studentList');
    const confirmButton = document.getElementById('confirmStudents');
    const studentButtons = document.getElementById('studentButtons');
    const generateButton = document.getElementById('generate');
    const copyButton = document.getElementById('copy');
    const promptPreview = document.getElementById('promptPreview');
    
    let draggingElement = null;

    const typeDescriptions = {
        '品學兼優型': {
            emoji: '1️⃣',
            desc: '博學多才、德行兼備、勤學好問、穩重踏實'
        },
        '穩健認真型': {
            emoji: '2️⃣',
            desc: '踏實肯幹、專注投入、穩中求進、細心謹慎'
        },
        '負責服務型': {
            emoji: '3️⃣',
            desc: '樂於助人、盡心盡力、服務熱忱、團隊精神'
        },
        '合群友善型': {
            emoji: '4️⃣',
            desc: '親切友善、樂於分享、團結合作、互助互愛'
        },
        '創意思維型': {
            emoji: '5️⃣',
            desc: '創意無限、思路敏捷、敢於突破、獨立思考'
        },
        '陽光體育型': {
            emoji: '6️⃣',
            desc: '活力四射、身心健全、熱愛運動、團隊合作'
        },
        '潛力待發型': {
            emoji: '7️⃣',
            desc: '潛能無限、厚積薄發、靜水深流、自我激勵'
        },
        '欠缺努力型': {
            emoji: '8️⃣',
            desc: '三心二意、漫不經心、心猿意馬、虎頭蛇尾'
        }
    };

    // Add descriptions to type zones
    document.querySelectorAll('.type-zone').forEach(zone => {
        const type = zone.dataset.type;
        const h3 = zone.querySelector('h3');
        h3.textContent = `${typeDescriptions[type].emoji} ${type}`;
        
        const description = document.createElement('div');
        description.className = 'type-description';
        description.textContent = typeDescriptions[type].desc;
        h3.after(description);
    });

    // 確認學生名單
    confirmButton.addEventListener('click', () => {
        const names = studentList.value.split('\n').filter(name => name.trim());
        studentButtons.innerHTML = '';
        
        names.forEach((name, index) => {
            const button = document.createElement('div');
            button.className = 'student-button';
            button.draggable = true;
            button.textContent = `${(index + 1).toString().padStart(2, '0')}.${name.trim()}`;
            
            button.addEventListener('dragstart', (e) => {
                draggingElement = button;
                e.dataTransfer.setData('text/plain', '');
            });
            
            studentButtons.appendChild(button);
        });
    });

    // 拖放功能
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            if (draggingElement) {
                zone.appendChild(draggingElement);
            }
        });
    });

    // 生成提示詞 - 修改排序邏輯和提示詞格式
    generateButton.addEventListener('click', () => {
        const grade = document.getElementById('grade').value;
        const wordCount = document.getElementById('wordCount').value;
        let students = [];

        document.querySelectorAll('.type-zone').forEach(zone => {
            const type = zone.dataset.type;
            const studentElements = zone.querySelector('.drop-zone').children;
            
            Array.from(studentElements).forEach(student => {
                students.push({
                    number: parseInt(student.textContent.split('.')[0]),
                    name: student.textContent,
                    type: type,
                    description: typeDescriptions[type].desc
                });
            });
        });

        students.sort((a, b) => a.number - b.number);

        const prompts = students.map(student => 
            `請為${grade}年級的學生「${student.name}」，根據他的特質「${student.type}：${student.description}」，用「正面、溫暖、鼓勵」的評語風格，生成「${wordCount}字」有創意、不重複的期末評語。\n\n`
        );

        promptPreview.textContent = prompts.join('');
    });

    // 複製提示詞
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(promptPreview.textContent)
            .then(() => alert('提示詞已複製到剪貼簿！'))
            .catch(err => console.error('複製失敗：', err));
    });
});