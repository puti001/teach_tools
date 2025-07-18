export function getRecordDataFromForm(form) {
    const formData = new FormData(form);
    
    const homework = formData.getAll('homework');
    const otherHomework = formData.get('homework_other').trim();
    if (otherHomework) {
        homework.push(otherHomework);
    }

    return {
        // id is handled separately
        date: formData.get('date'),
        textbook: formData.get('textbook').trim(),
        workbook: formData.get('workbook').trim(),
        homework: homework,
        assessment: formData.get('assessment').trim(),
        notes: formData.get('notes').trim(),
    };
}

